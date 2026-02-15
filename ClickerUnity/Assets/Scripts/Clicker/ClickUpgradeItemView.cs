using UnityEngine;
using UnityEngine.UI;

namespace ClickerUnity
{
    public class ClickUpgradeItemView : MonoBehaviour
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
            if (clickerGame == null)
            {
                if (currentLevelText != null)
                {
                    currentLevelText.text = "Current Lv.-";
                }

                if (detailsText != null)
                {
                    detailsText.text = "Effect: - -> - | Cost: - | Eff: -";
                }

                if (upgradeButton != null)
                {
                    upgradeButton.interactable = false;
                }

                if (upgradeButtonLabel != null)
                {
                    upgradeButtonLabel.text = "Unavailable";
                }

                return;
            }

            var currentLevel = clickerGame.ClickLevel;
            var currentEffect = clickerGame.ClickValue;
            var nextEffect = clickerGame.GetNextClickValue();
            var effectGain = Mathf.Max(0, nextEffect - currentEffect);
            var nextCost = clickerGame.GetClickUpgradeCost();
            var canAfford = clickerGame.CanAfford(nextCost);
            var missingCurrency = clickerGame.GetMissingCurrencyForCost(nextCost);
            var efficiency = nextCost > 0 ? (float)effectGain / nextCost : 0f;

            if (currentLevelText != null)
            {
                currentLevelText.text = $"Current Lv.{currentLevel}";
            }

            if (detailsText != null)
            {
                var summary =
                    $"Effect: +{currentEffect}/click -> +{nextEffect}/click (Delta +{effectGain}) | Cost: {nextCost} | Eff: {efficiency:0.###}";
                if (!canAfford && missingCurrency > 0)
                {
                    summary += $" | Need +{missingCurrency} Gold";
                }

                detailsText.text = summary;
            }

            if (upgradeButton != null)
            {
                upgradeButton.interactable = canAfford;
            }

            if (upgradeButtonLabel != null)
            {
                upgradeButtonLabel.text = canAfford ? "Upgrade" : $"Need {missingCurrency}";
            }
        }

        private void OnUpgradeButtonClicked()
        {
            if (clickerGame == null)
            {
                return;
            }

            clickerGame.TryUpgradeClickValue();
        }
    }
}
