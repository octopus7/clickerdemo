using UnityEngine;
using UnityEngine.UI;

namespace ClickerUnity
{
    public class AutoIncomeUpgradeItemView : MonoBehaviour
    {
        [SerializeField] private Text currentLevelText;
        [SerializeField] private Text detailsText;
        [SerializeField] private Button upgradeButton;
        [SerializeField] private Text upgradeButtonLabel;

        private ClickerGame clickerGame;

        public void Bind(ClickerGame game)
        {
            if (clickerGame != null)
            {
                clickerGame.EconomyChanged -= Refresh;
            }

            if (upgradeButton != null)
            {
                upgradeButton.onClick.RemoveListener(OnUpgradeButtonClicked);
            }

            clickerGame = game;

            if (clickerGame != null)
            {
                clickerGame.EconomyChanged += Refresh;
            }

            if (upgradeButton != null)
            {
                upgradeButton.onClick.AddListener(OnUpgradeButtonClicked);
            }

            Refresh();
        }

        private void OnDestroy()
        {
            if (clickerGame != null)
            {
                clickerGame.EconomyChanged -= Refresh;
            }

            if (upgradeButton != null)
            {
                upgradeButton.onClick.RemoveListener(OnUpgradeButtonClicked);
            }
        }

        public void Refresh()
        {
            if (upgradeButtonLabel != null)
            {
                upgradeButtonLabel.text = "Upgrade";
            }

            if (clickerGame == null)
            {
                if (currentLevelText != null)
                {
                    currentLevelText.text = "Current Lv.-";
                }

                if (detailsText != null)
                {
                    detailsText.text = "Effect: -   Next Cost: -";
                }

                if (upgradeButton != null)
                {
                    upgradeButton.interactable = false;
                }

                return;
            }

            var currentLevel = clickerGame.AutoIncomeLevel;
            var currentEffect = clickerGame.AutoIncomePerSecond;
            var nextCost = clickerGame.GetAutoIncomeUpgradeCost();

            if (currentLevelText != null)
            {
                currentLevelText.text = $"Current Lv.{currentLevel}";
            }

            if (detailsText != null)
            {
                detailsText.text = $"Effect: +{currentEffect}/s   Next Cost: {nextCost}";
            }

            if (upgradeButton != null)
            {
                upgradeButton.interactable = clickerGame.CanAfford(nextCost);
            }
        }

        private void OnUpgradeButtonClicked()
        {
            if (clickerGame == null)
            {
                return;
            }

            clickerGame.TryUpgradeAutoIncome();
        }
    }
}
