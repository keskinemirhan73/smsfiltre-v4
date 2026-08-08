import IdentityLookup
import Foundation

final class MessageFilterExtension: ILMessageFilterExtension { }

private func categoryAction(
    _ category: String,
    mapping: [String: Any]
) -> ILMessageFilterAction {
    let mappingKey = category == "junk" ? "spam" : category
    let mappedCategory = mapping[mappingKey] as? String ?? category

    switch mappedCategory {
    case "junk": return .junk
    case "transaction": return .transaction
    case "promotion": return .promotion
    default: return .allow
    }
}

private func timeInMinutes(_ value: String) -> Int? {
    let parts = value.split(separator: ":")
    guard parts.count == 2,
          let hour = Int(parts[0]),
          let minute = Int(parts[1]),
          (0...23).contains(hour),
          (0...59).contains(minute) else {
        return nil
    }
    return hour * 60 + minute
}

private func isWithinSchedule(_ settings: [String: Any]) -> Bool {
    guard settings["filterScheduleEnabled"] as? Bool == true else { return true }
    guard let start = timeInMinutes(settings["scheduleStart"] as? String ?? "22:00"),
          let end = timeInMinutes(settings["scheduleEnd"] as? String ?? "08:00") else {
        return true
    }

    let calendar = Calendar.current
    let now = Date()
    let current = calendar.component(.hour, from: now) * 60
        + calendar.component(.minute, from: now)
    return start <= end
        ? (current >= start && current <= end)
        : (current >= start || current <= end)
}

private let eventQueueLock = NSLock()

private func recordEvent(sender: String, action: ILMessageFilterAction) {
    eventQueueLock.lock()
    defer { eventQueueLock.unlock() }
    guard let defaults = UserDefaults(suiteName: "group.com.filtreai.app") else { return }
    let jsonStr = defaults.string(forKey: "smsfilter_event_queue_json") ?? "[]"
    var queue: [[String: Any]] = []
    if let data = jsonStr.data(using: .utf8),
       let parsed = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
        queue = parsed
    }

    if queue.count > 50 {
        queue = Array(queue.suffix(49))
    }

    let maskSender: (String) -> String = { s in
        let trimmed = s.trimmingCharacters(in: .whitespacesAndNewlines)
        let suffix = String(trimmed.suffix(4))
        return suffix.isEmpty ? "Bilinmeyen" : "***\(suffix)"
    }

    let statusStr: String
    let previewStr: String
    switch action {
    case .junk:
        statusStr = "suspicious"
        previewStr = "Şüpheli SMS iOS filtre tarafından yakalandı."
    case .transaction:
        statusStr = "transaction"
        previewStr = "İşlem SMS'i iOS filtre tarafından sınıflandırıldı."
    case .promotion:
        statusStr = "promotion"
        previewStr = "Tanıtım SMS'i iOS filtre tarafından sınıflandırıldı."
    default:
        statusStr = "allowed"
        previewStr = "SMS iOS filtre tarafından analiz edildi."
    }

    let event: [String: Any] = [
        "id": UUID().uuidString,
        "sender": maskSender(sender),
        "preview": previewStr,
        "status": statusStr,
        "timestamp": Int64(Date().timeIntervalSince1970 * 1000)
    ]
    queue.append(event)

    if let outputData = try? JSONSerialization.data(withJSONObject: queue),
       let outputStr = String(data: outputData, encoding: .utf8) {
        defaults.set(outputStr, forKey: "smsfilter_event_queue_json")
    }
}

extension MessageFilterExtension: ILMessageFilterQueryHandling {
    func handle(
        _ queryRequest: ILMessageFilterQueryRequest,
        context: ILMessageFilterExtensionContext,
        completion: @escaping (ILMessageFilterQueryResponse) -> Void
    ) {
        let response = ILMessageFilterQueryResponse()
        let sender = String((queryRequest.sender ?? "").prefix(256))
        let body = String((queryRequest.messageBody ?? "").prefix(4096))
        let lowerBody = body.lowercased()
        let lowerSender = sender.lowercased()

        let defaults = UserDefaults(suiteName: "group.com.filtreai.app")
        let jsonString = defaults?.string(forKey: "smsfilter_config_json") ?? ""

        var settings: [String: Any] = [:]
        var rules: [[String: Any]] = []
        var threatDatabase: [[String: Any]] = []

        if let data = jsonString.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            settings = json["settings"] as? [String: Any] ?? [:]
            rules = json["rules"] as? [[String: Any]] ?? []
            threatDatabase = json["threatDb"] as? [[String: Any]] ?? []
        }

        let whitelist = settings["whitelist"] as? [String] ?? []
        let isWhitelisted = whitelist.contains { entry in
            let value = entry.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !value.isEmpty else { return false }
            return sender.compare(value, options: .caseInsensitive) == .orderedSame
        }

        guard !isWhitelisted, isWithinSchedule(settings) else {
            response.action = .allow
            recordEvent(sender: sender, action: response.action)
            completion(response)
            return
        }

        let mapping = settings["categoryMapping"] as? [String: Any] ?? [:]
        let invalidNumberFilter = settings["invalidNumberFilter"] as? Bool ?? false
        let blockForeignNumbers = settings["blockForeignNumbers"] as? Bool ?? false
        let isForeignSender = sender.hasPrefix("+") && !sender.hasPrefix("+90")
        let hasLinkInBody = body.range(of: "(https?://|[a-z0-9-]+\\.(gd|ly|com|cc|top|xyz|me|co|site|info|fun|icu))", options: [.regularExpression, .caseInsensitive]) != nil

        if isForeignSender && (hasLinkInBody || (invalidNumberFilter && blockForeignNumbers)) {
            response.action = categoryAction("junk", mapping: mapping)
            recordEvent(sender: sender, action: response.action)
            completion(response)
            return
        }

        let blockArabic = settings["blockArabic"] as? Bool ?? false
        if blockArabic && (
            body.range(of: "[\\u0600-\\u06FF]", options: .regularExpression) != nil
                || sender.range(of: "[\\u0600-\\u06FF]", options: .regularExpression) != nil
        ) {
            response.action = categoryAction("junk", mapping: mapping)
            recordEvent(sender: sender, action: response.action)
            completion(response)
            return
        }

        let customFraudKeywords = settings["customFraudKeywords"] as? [String] ?? []
        if settings["fraudFilter"] as? Bool ?? true,
           customFraudKeywords.contains(where: { keyword in
               let normalized = keyword.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
               return !normalized.isEmpty
                   && normalized.count <= 160
                   && lowerBody.contains(normalized)
           }) {
            response.action = categoryAction("junk", mapping: mapping)
            recordEvent(sender: sender, action: response.action)
            completion(response)
            return
        }

        let filterTransactions = settings["filterTransactions"] as? Bool ?? false
        let filterPromotions = settings["filterPromotions"] as? Bool ?? false
        for rule in rules {
            guard let keyword = rule["keyword"] as? String,
                  !keyword.isEmpty,
                  keyword.count <= 160,
                  let type = rule["type"] as? String,
                  let category = rule["category"] as? String,
                  let matchTarget = rule["matchTarget"] as? String else { continue }
            let matchMode = rule["matchMode"] as? String ?? "contains"

            let textToCheck: String
            switch matchTarget {
            case "sender": textToCheck = sender
            case "content": textToCheck = body
            default: textToCheck = "\(sender) \(body)"
            }

            let isMatch: Bool
            if type == "regex" {
                isMatch = textToCheck.range(of: keyword, options: [.regularExpression, .caseInsensitive]) != nil
            } else if matchTarget == "sender" && matchMode == "exact" {
                isMatch = sender.trimmingCharacters(in: .whitespacesAndNewlines)
                    .compare(keyword.trimmingCharacters(in: .whitespacesAndNewlines), options: .caseInsensitive) == .orderedSame
            } else {
                isMatch = textToCheck.range(of: keyword, options: .caseInsensitive) != nil
            }

            if isMatch {
                if category == "transaction" && matchMode != "exact" && !filterTransactions {
                    response.action = .allow
                } else if category == "promotion" && matchMode != "exact" && !filterPromotions {
                    response.action = .allow
                } else {
                    response.action = categoryAction(category, mapping: mapping)
                }
                recordEvent(sender: sender, action: response.action)
                completion(response)
                return
            }
        }

        let smartFilter = settings["smartFilter"] as? Bool ?? true
        let databaseFilter = settings["databaseFilter"] as? Bool ?? true
        let fraudFilter = settings["fraudFilter"] as? Bool ?? true
        if smartFilter && (databaseFilter || fraudFilter) {
            for threat in threatDatabase {
                guard let keyword = threat["keyword"] as? String,
                      !keyword.isEmpty,
                      keyword.count <= 160,
                      let type = threat["type"] as? String else { continue }

                let isMatch = type == "regex"
                    ? body.range(of: keyword, options: [.regularExpression, .caseInsensitive]) != nil
                        || sender.range(of: keyword, options: [.regularExpression, .caseInsensitive]) != nil
                    : lowerBody.contains(keyword.lowercased())
                        || lowerSender.contains(keyword.lowercased())

                if isMatch {
                    response.action = categoryAction("junk", mapping: mapping)
                    recordEvent(sender: sender, action: response.action)
                    completion(response)
                    return
                }
            }
        }

        response.action = .allow
        recordEvent(sender: sender, action: response.action)
        completion(response)
    }
}
