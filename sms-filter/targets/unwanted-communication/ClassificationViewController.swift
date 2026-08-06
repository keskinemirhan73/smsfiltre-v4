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
            case .junk: return "Spam veya dolandırıcılık şüphesi"
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
    }

    private let selectionStack = UIStackView()
    private var selectedCategory: ReportCategory?
    private var categoryButtons: [ReportCategory: UIButton] = [:]

    override func viewDidLoad() {
        super.viewDidLoad()
        configureInterface()
    }

    override func prepare(for request: ILClassificationRequest) {
        super.prepare(for: request)
        loadViewIfNeeded()
        selectedCategory = nil
        extensionContext.isReadyForClassificationResponse = false
        refreshSelection()
    }

    override func classificationResponse(for request: ILClassificationRequest) -> ILClassificationResponse {
        guard request is ILMessageClassificationRequest else {
            return ILClassificationResponse(action: .none)
        }
        guard let category = selectedCategory else {
            return ILClassificationResponse(action: .none)
        }

        let response = ILClassificationResponse(action: category.responseAction)
        response.userInfo = ["category": category.rawValue]
        return response
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
        subtitleLabel.text = "FiltreAI’nin gelecekte benzer mesajları daha doğru ayırmasına yardımcı olun."
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
        privacyLabel.text = "İstenmeyen veya İzin Verilen seçip Bitti dediğinizde Apple, rapor SMS'ini +905438260667 alıcısıyla oluşturur. Göndermeden önce onaylayabilir veya iptal edebilirsiniz. Standart SMS/operatör ücretleri uygulanabilir. Telefon numaranız alıcı tarafından görülebilir. İşlem ve Promosyon seçimleri ile çağrı bildirimleri SMS göndermez. FiltreAI bu raporu kendi sunucusuna göndermez."
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
