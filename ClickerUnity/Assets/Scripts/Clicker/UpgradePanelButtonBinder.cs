using UnityEngine;
using UnityEngine.UI;

namespace ClickerUnity
{
    public class UpgradePanelButtonBinder : MonoBehaviour
    {
        [SerializeField] private Button openPanelButton;
        [SerializeField] private UpgradePanelController panelController;

        private void Awake()
        {
            Bind();
        }

        private void OnDestroy()
        {
            if (openPanelButton != null)
            {
                openPanelButton.onClick.RemoveListener(OnOpenPanelButtonClicked);
            }
        }

        public void Bind()
        {
            if (openPanelButton == null)
            {
                return;
            }

            openPanelButton.onClick.RemoveListener(OnOpenPanelButtonClicked);
            openPanelButton.onClick.AddListener(OnOpenPanelButtonClicked);
            openPanelButton.interactable = panelController != null;
        }

        private void OnOpenPanelButtonClicked()
        {
            if (panelController == null)
            {
                return;
            }

            panelController.Toggle();
        }
    }
}
