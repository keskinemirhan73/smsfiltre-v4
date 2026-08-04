import UIKit
import MobileCoreServices
import UniformTypeIdentifiers

class ActionViewController: UIViewController {

    @IBOutlet weak var imageView: UIImageView!

    override func viewDidLoad() {
        super.viewDidLoad()
    
        // Read shared input items from Apple Messages or Share Sheet
        var textContent = ""
        for item in self.extensionContext?.inputItems as? [NSExtensionItem] ?? [] {
            for provider in item.attachments ?? [] {
                if #available(iOS 14.0, *) {
                    if provider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                        provider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) { (item, error) in
                            if let text = item as? String {
                                textContent = text
                            }
                        }
                    }
                }
            }
        }
        
        setupUI()
    }

    private func setupUI() {
        self.view.backgroundColor = UIColor(red: 242/255.0, green: 242/255.0, blue: 247/255.0, alpha: 1.0)
        
        // Navigation Header
        let headerView = UIView(frame: CGRect(x: 0, y: 0, width: self.view.bounds.width, height: 60))
        headerView.backgroundColor = .white
        
        let titleLabel = UILabel(frame: CGRect(x: 0, y: 15, width: self.view.bounds.width, height: 30))
        titleLabel.text = "FiltreAI"
        titleLabel.textAlignment = .center
        titleLabel.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        headerView.addSubview(titleLabel)
        
        let closeButton = UIButton(type: .system)
        closeButton.frame = CGRect(x: 16, y: 15, width: 30, height: 30)
        closeButton.setTitle("✕", for: .normal)
        closeButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .medium)
        closeButton.addTarget(self, action: #selector(closePressed), for: .touchUpInside)
        headerView.addSubview(closeButton)
        
        let doneButton = UIButton(type: .system)
        doneButton.frame = CGRect(x: self.view.bounds.width - 46, y: 15, width: 30, height: 30)
        doneButton.setTitle("✓", for: .normal)
        doneButton.titleLabel?.font = UIFont.systemFont(ofSize: 18, weight: .bold)
        doneButton.addTarget(self, action: #selector(closePressed), for: .touchUpInside)
        headerView.addSubview(doneButton)
        
        self.view.addSubview(headerView)
    }

    @objc func closePressed() {
        self.extensionContext?.completeRequest(returningItems: self.extensionContext?.inputItems, completionHandler: nil)
    }
}
