using UnityEngine;
using UnityEngine.UI;

namespace ClickerUnity
{
    public class UpgradePanelController : MonoBehaviour
    {
        [SerializeField] private GameObject panelRoot;
        [SerializeField] private Button closeButton;
        [SerializeField] private ClickerGame clickerGame;
        [SerializeField] private ClickUpgradeItemView clickUpgradeItemView;
        [SerializeField] private AutoIncomeUpgradeItemView autoIncomeUpgradeItemView;
        [SerializeField] private bool startHidden = true;

        private void Awake()
        {
            if (panelRoot == null)
            {
                panelRoot = gameObject;
            }

            if (clickerGame == null)
            {
                clickerGame = FindFirstObjectByType<ClickerGame>();
            }

            if (autoIncomeUpgradeItemView != null)
            {
                autoIncomeUpgradeItemView.Bind(clickerGame);
            }

            if (clickUpgradeItemView != null)
            {
                clickUpgradeItemView.Bind(clickerGame);
            }

            if (closeButton != null)
            {
                closeButton.onClick.AddListener(Hide);
            }

            if (startHidden)
            {
                Hide();
            }
            else
            {
                Show();
            }
        }

        private void OnDestroy()
        {
            if (closeButton != null)
            {
                closeButton.onClick.RemoveListener(Hide);
            }
        }

        public void Toggle()
        {
            if (panelRoot == null)
            {
                return;
            }

            if (panelRoot.activeSelf)
            {
                Hide();
                return;
            }

            Show();
        }

        public void Show()
        {
            if (panelRoot == null)
            {
                return;
            }

            panelRoot.SetActive(true);
            if (autoIncomeUpgradeItemView != null)
            {
                autoIncomeUpgradeItemView.Refresh();
            }

            if (clickUpgradeItemView != null)
            {
                clickUpgradeItemView.Refresh();
            }
        }

        public void Hide()
        {
            if (panelRoot == null)
            {
                return;
            }

            panelRoot.SetActive(false);
        }

        public void SetClickerGame(ClickerGame game)
        {
            clickerGame = game;
            if (autoIncomeUpgradeItemView != null)
            {
                autoIncomeUpgradeItemView.Bind(clickerGame);
            }

            if (clickUpgradeItemView != null)
            {
                clickUpgradeItemView.Bind(clickerGame);
            }
        }
    }
}
