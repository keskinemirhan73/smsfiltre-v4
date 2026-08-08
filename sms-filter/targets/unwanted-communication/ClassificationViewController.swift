import IdentityLookup
import IdentityLookupUI
import UIKit

final class ClassificationViewController: ILClassificationUIExtensionViewController {
    private enum ReportCategory: String, CaseIterable {
        case junk
        case allowed
        case transaction
        case promotion

        var title: String {
            switch self {
            case .junk: return "İstenmeyen"
            case .allowed: return "İzin Verilen"
            case .transaction: return "İşlem"
            case .promotion: return "Promosyon"
            }
        }

        var subtitle: String {
            switch self {
            case .junk: return "Spam olarak bildirir; göndericiyi engellemez"
            case .allowed: return "Güvenilir ve görmek istediğiniz mesaj"
            case .transaction: return "Sipariş, ödeme veya doğrulama bildirimi"
            case .promotion: return "Kampanya veya tanıtım mesajı"
            }
        }

        var symbolName: String {
            switch self {
            case .junk: return "trash"
            case .allowed: return "checkmark.shield"
            case .transaction: return "arrow.left.arrow.right"
            case .promotion: return "megaphone"
            }
        }

        var responseAction: ILClassificationAction {
            switch self {
            case .junk: return .reportJunk
            case .allowed: return .reportNotJunk
            case .transaction, .promotion: return .none
            }
        }

        var eventStatus: String {
            switch self {
            case .junk: return "suspicious"
            case .allowed: return "allowed"
            case .transaction: return "transaction"
            case .promotion: return "promotion"
            }
        }

        var eventPreview: String {
            switch self {
            case .junk: return "Mesajlar uygulamasından istenmeyen olarak bildirildi."
            case .allowed: return "Mesajlar uygulamasından izin verildi."
            case .transaction: return "Mesajlar panelinde işlem olarak seçildi."
            case .promotion: return "Mesajlar panelinde promosyon olarak seçildi."
            }
        }
    }

    private let eventQueueKey = "smsfilter_report_event_queue_json"
    private let pendingOverrideQueueKey = "smsfilter_pending_sender_override_queue_json"
    private let pendingOverrideIdsKey = "smsfilter_pending_sender_override_ids_json"
    private let pendingOverrideKeyPrefix = "smsfilter_pending_sender_override_"
    private let maximumQueuedEvents = 50
    private static let eventQueueLock = NSLock()
    private let selectionStack = UIStackView()
    private var activeMessageRequest: ILMessageClassificationRequest?
    private var lastPendingTimestamp = 0
    private var selectedCategory: ReportCategory?
    private var categoryButtons: [ReportCategory: UIButton] = [:]

    override func viewDidLoad() {
        super.viewDidLoad()
        configureInterface()
    }

    override func prepare(for request: ILClassificationRequest) {
        super.prepare(for: request)
        loadViewIfNeeded()
        activeMessageRequest = request as? ILMessageClassificationRequest
        selectedCategory = nil
        extensionContext.isReadyForClassificationResponse = false
        refreshSelection()
    }

    override func classificationResponse(for request: ILClassificationRequest) -> ILClassificationResponse {
        guard let messageRequest = request as? ILMessageClassificationRequest else {
            return ILClassificationResponse(action: .none)
        }
        guard let category = selectedCategory else {
            return ILClassificationResponse(action: .none)
        }

        persistReportEvents(from: messageRequest, category: category)

        let response = ILClassificationResponse(action: category.responseAction)
        response.userInfo = ["category": category.rawValue]
        return response
    }

    private func persistReportEvents(
        from messageRequest: ILMessageClassificationRequest,
        category: ReportCategory
    ) {
        guard let defaults = UserDefaults(suiteName: "group.com.filtreai.app") else { return }

        Self.eventQueueLock.lock()
        defer { Self.eventQueueLock.unlock() }

        let existingEvents: [[String: Any]] = {
            let queueData: Data?
            if let storedData = defaults.data(forKey: eventQueueKey) {
                queueData = storedData
            } else if let rawQueue = defaults.string(forKey: eventQueueKey) {
                queueData = rawQueue.data(using: .utf8)
            } else {
                queueData = nil
            }
            guard let queueData,
                  let decoded = try? JSONSerialization.jsonObject(with: queueData) as? [[String: Any]]
            else { return [] }
            return decoded
        }()

        let baseTimestamp = Int(Date().timeIntervalSince1970 * 1_000)
        let newEvents = messageRequest.messageCommunications.enumerated().map { index, communication in
            [
                "id": "report-\(UUID().uuidString)",
                "sender": maskedSender(communication.sender),
                "preview": category.eventPreview,
                "status": category.eventStatus,
                "source": "report",
                "timestamp": baseTimestamp + index,
            ] as [String: Any]
        }

        guard !newEvents.isEmpty else { return }
        let queuedEvents = Array((existingEvents + newEvents).suffix(maximumQueuedEvents))
        guard let encoded = try? JSONSerialization.data(withJSONObject: queuedEvents) else { return }
        defaults.set(encoded, forKey: eventQueueKey)
        defaults.synchronize()
    }

    private func persistPendingSenderCorrections(
        from messageRequest: ILMessageClassificationRequest,
        category: ReportCategory
    ) {
        guard let defaults = UserDefaults(suiteName: "group.com.filtreai.app") else { return }

        Self.eventQueueLock.lock()
        defer { Self.eventQueueLock.unlock() }

        let existingIds: [String] = {
            let storedData = defaults.data(forKey: pendingOverrideIdsKey)
                ?? defaults.string(forKey: pendingOverrideIdsKey)?.data(using: .utf8)
            guard let storedData,
                  let decoded = try? JSONSerialization.jsonObject(with: storedData) as? [String]
            else { return [] }
            return decoded
        }()

        let existingQueue: [[String: Any]] = {
            let storedData = defaults.data(forKey: pendingOverrideQueueKey)
                ?? defaults.string(forKey: pendingOverrideQueueKey)?.data(using: .utf8)
            guard let storedData,
                  let decoded = try? JSONSerialization.jsonObject(with: storedData) as? [[String: Any]]
            else { return [] }
            return decoded
        }()

        let currentTimestamp = Int(Date().timeIntervalSince1970 * 1_000)
        let baseTimestamp = max(currentTimestamp, lastPendingTimestamp + 1)
        lastPendingTimestamp = baseTimestamp + max(messageRequest.messageCommunications.count - 1, 0)
        let newCorrections = messageRequest.messageCommunications.enumerated().compactMap { index, communication -> (String, [String: Any])? in
            guard let rawSender = communication.sender else { return nil }
            let sender = rawSender.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !sender.isEmpty, sender.count <= 64, isSafeSender(sender) else { return nil }
            let id = "pending-\(UUID().uuidString)"
            return (id, [
                "id": id,
                "sender": sender,
                "category": category.rawValue,
                "timestamp": baseTimestamp + index,
            ])
        }

        guard !newCorrections.isEmpty else { return }
        let newIds = newCorrections.map(\.0)
        let queuedIds = Array((existingIds + newIds).suffix(maximumQueuedEvents))
        let evictedIds = Set(existingIds).subtracting(queuedIds)

        for (id, correction) in newCorrections {
            guard let encoded = try? JSONSerialization.data(withJSONObject: correction) else { continue }
            defaults.set(encoded, forKey: "\(pendingOverrideKeyPrefix)\(id)")
        }
        evictedIds.forEach { defaults.removeObject(forKey: "\(pendingOverrideKeyPrefix)\($0)") }
        let queuedCorrections = Array(
            (existingQueue + newCorrections.map { $0.1 }).suffix(maximumQueuedEvents)
        )
        guard let encodedQueue = try? JSONSerialization.data(withJSONObject: queuedCorrections) else { return }
        defaults.set(encodedQueue, forKey: pendingOverrideQueueKey)
        guard let encodedIds = try? JSONSerialization.data(withJSONObject: queuedIds) else { return }
        defaults.set(encodedIds, forKey: pendingOverrideIdsKey)
        defaults.synchronize()
    }

    private func isSafeSender(_ sender: String) -> Bool {
        !sender.unicodeScalars.contains { scalar in
            CharacterSet.controlCharacters.contains(scalar)
                || (0x202A...0x202E).contains(scalar.value)
                || (0x2066...0x2069).contains(scalar.value)
        }
    }

    private func maskedSender(_ sender: String?) -> String {
        guard let sender else { return "Bilinmeyen" }
        let trimmed = sender.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, isSafeSender(trimmed) else { return "Bilinmeyen" }
        guard trimmed.count > 4 else { return "***" }
        return "***\(trimmed.suffix(4))"
    }

    private func configureInterface() {
        view.backgroundColor = .systemGroupedBackground

        let scrollView = UIScrollView()
        scrollView.alwaysBounceVertical = true
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scrollView)

        let contentStack = UIStackView()
        contentStack.axis = .vertical
        contentStack.spacing = 12
        contentStack.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(contentStack)

        let titleLabel = UILabel()
        titleLabel.text = "Mesajı sınıflandır"
        titleLabel.font = .preferredFont(forTextStyle: .title2)
        titleLabel.adjustsFontForContentSizeCategory = true
        titleLabel.numberOfLines = 0

        let subtitleLabel = UILabel()
        subtitleLabel.text = "Kategori seçiminizi FiltreAI'de onaylayıp kalıcı gönderici kuralına dönüştürün."
        subtitleLabel.font = .preferredFont(forTextStyle: .body)
        subtitleLabel.textColor = .secondaryLabel
        subtitleLabel.adjustsFontForContentSizeCategory = true
        subtitleLabel.numberOfLines = 0

        selectionStack.axis = .vertical
        selectionStack.spacing = 10

        ReportCategory.allCases.forEach { category in
            let button = makeCategoryButton(category)
            categoryButtons[category] = button
            selectionStack.addArrangedSubview(button)
        }

        let privacyLabel = UILabel()
        privacyLabel.text = "Seçiminiz bekleyen ayar olarak yalnız cihazda saklanır; mesaj gövdesi saklanmaz. Bitti dedikten sonra FiltreAI'yi açıp kuralı onaylayın. Onaylanana kadar filtre kuralı oluşmaz. İstenmeyen seçimi göndereni engellemeden spam olarak bildirir. Mesajlar'da Sil ve İstenmeyen Olarak Bildir ile başladıysanız mesaj Apple tarafından zaten silinir; FiltreAI bunu geri alamaz. İstenmeyen veya İzin Verilen seçip Bitti dediğinizde Apple, rapor SMS'ini +905438260667 alıcısıyla oluşturur. Göndermeden önce onaylayabilir veya iptal edebilirsiniz. Standart SMS/operatör ücretleri uygulanabilir. Telefon numaranız alıcı tarafından görülebilir. İşlem ve Promosyon seçimleri ile çağrı bildirimleri SMS göndermez. FiltreAI bu raporu kendi sunucusuna göndermez."
        privacyLabel.font = .preferredFont(forTextStyle: .footnote)
        privacyLabel.textColor = .secondaryLabel
        privacyLabel.adjustsFontForContentSizeCategory = true
        privacyLabel.numberOfLines = 0

        contentStack.addArrangedSubview(titleLabel)
        contentStack.addArrangedSubview(subtitleLabel)
        contentStack.setCustomSpacing(20, after: subtitleLabel)
        contentStack.addArrangedSubview(selectionStack)
        contentStack.setCustomSpacing(20, after: selectionStack)
        contentStack.addArrangedSubview(privacyLabel)

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            contentStack.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor, constant: 20),
            contentStack.leadingAnchor.constraint(equalTo: scrollView.frameLayoutGuide.leadingAnchor, constant: 20),
            contentStack.trailingAnchor.constraint(equalTo: scrollView.frameLayoutGuide.trailingAnchor, constant: -20),
            contentStack.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor, constant: -24),
        ])
    }

    private func makeCategoryButton(_ category: ReportCategory) -> UIButton {
        var configuration = UIButton.Configuration.filled()
        configuration.title = category.title
        configuration.subtitle = category.subtitle
        configuration.image = UIImage(systemName: category.symbolName)
        configuration.imagePadding = 12
        configuration.imagePlacement = .leading
        configuration.baseBackgroundColor = .secondarySystemGroupedBackground
        configuration.baseForegroundColor = .label
        configuration.cornerStyle = .large
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 14, leading: 16, bottom: 14, trailing: 16)
        configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { attributes in
            var updated = attributes
            updated.font = .preferredFont(forTextStyle: .headline)
            return updated
        }
        configuration.subtitleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { attributes in
            var updated = attributes
            updated.font = .preferredFont(forTextStyle: .subheadline)
            return updated
        }

        let button = UIButton(configuration: configuration)
        button.tag = ReportCategory.allCases.firstIndex(of: category) ?? 0
        button.contentHorizontalAlignment = .leading
        button.accessibilityLabel = "\(category.title), \(category.subtitle)"
        button.addTarget(self, action: #selector(selectCategory(_:)), for: .touchUpInside)
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 72).isActive = true
        return button
    }

    @objc private func selectCategory(_ sender: UIButton) {
        guard ReportCategory.allCases.indices.contains(sender.tag) else { return }
        selectedCategory = ReportCategory.allCases[sender.tag]
        if let activeMessageRequest, let selectedCategory {
            persistPendingSenderCorrections(from: activeMessageRequest, category: selectedCategory)
        }
        extensionContext.isReadyForClassificationResponse = true
        refreshSelection()
    }

    private func refreshSelection() {
        categoryButtons.forEach { category, button in
            let isSelected = category == selectedCategory
            guard var configuration = button.configuration else { return }
            configuration.baseBackgroundColor = isSelected ? .systemBlue : .secondarySystemGroupedBackground
            configuration.baseForegroundColor = isSelected ? .white : .label
            button.configuration = configuration
            button.accessibilityTraits = isSelected ? [.button, .selected] : .button
        }
    }
}
