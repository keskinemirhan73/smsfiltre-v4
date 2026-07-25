import IdentityLookup
import Foundation

final class MessageFilterExtension: ILMessageFilterExtension { }

extension MessageFilterExtension: ILMessageFilterQueryHandling {
    func handle(_ queryRequest: ILMessageFilterQueryRequest, context: ILMessageFilterExtensionContext, completion: @escaping (ILMessageFilterQueryResponse) -> Void) {
        
        let response = ILMessageFilterQueryResponse()
        let sender = queryRequest.sender ?? ""
        let body = queryRequest.messageBody ?? ""
        let lowerBody = body.lowercased()
        let lowerSender = sender.lowercased()
        
        let defaults = UserDefaults(suiteName: "group.com.smsfilter.app")
        let jsonStr = defaults?.string(forKey: "smsfilter_config_json") ?? ""
        
        var underAttackMode = false
        var smartFilter = true
        var rules: [[String: Any]] = []
        var threatDb: [[String: Any]] = []
        
        // Parse config JSON
        if let data = jsonStr.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
            
            if let settings = json["settings"] as? [String: Any] {
                underAttackMode = settings["underAttackMode"] as? Bool ?? false
                smartFilter = settings["smartFilter"] as? Bool ?? true
            }
            if let r = json["rules"] as? [[String: Any]] { rules = r }
            if let t = json["threatDb"] as? [[String: Any]] { threatDb = t }
        }
        
        // 1. Under Attack Mode — block everything
        if underAttackMode {
            response.action = .junk
            completion(response)
            return
        }
        
        // 2. Custom Rules (first match wins)
        for rule in rules {
            guard let keyword = rule["keyword"] as? String,
                  let type = rule["type"] as? String,
                  let category = rule["category"] as? String,
                  let matchTarget = rule["matchTarget"] as? String else { continue }
            
            let textToCheck: String
            switch matchTarget {
            case "sender": textToCheck = sender
            case "content": textToCheck = body
            default: textToCheck = "\(sender) \(body)"
            }
            
            let isMatch: Bool
            if type == "regex" {
                isMatch = textToCheck.range(of: keyword, options: .regularExpression) != nil
            } else {
                isMatch = textToCheck.lowercased().contains(keyword.lowercased())
            }
            
            if isMatch {
                switch category {
                case "junk":
                    response.action = .junk
                case "transaction":
                    response.action = .transaction
                case "promotion":
                    response.action = .promotion
                case "allowed":
                    response.action = .allow
                default:
                    response.action = .allow
                }
                completion(response)
                return
            }
        }
        
        // 3. Threat Database
        if smartFilter {
            for threat in threatDb {
                guard let keyword = threat["keyword"] as? String,
                      let type = threat["type"] as? String else { continue }
                
                let isMatch: Bool
                if type == "regex" {
                    isMatch = body.range(of: keyword, options: .regularExpression) != nil ||
                              sender.range(of: keyword, options: .regularExpression) != nil
                } else {
                    isMatch = lowerBody.contains(keyword.lowercased()) || lowerSender.contains(keyword.lowercased())
                }
                
                if isMatch {
                    response.action = .junk
                    completion(response)
                    return
                }
            }
        }
        
        // 4. Default: Allow
        response.action = .allow
        completion(response)
    }
}
