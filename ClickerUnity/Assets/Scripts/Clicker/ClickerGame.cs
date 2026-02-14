using UnityEngine;
using UnityEngine.UI;

namespace ClickerUnity
{
    public class ClickerGame : MonoBehaviour
    {
        [SerializeField] private Text currencyText;
        [SerializeField] private Button clickButton;
        [SerializeField] private int startingCurrency = 0;
        [SerializeField] private int clickValue = 1;

        private int currency;

        private void Awake()
        {
            currency = startingCurrency;

            if (clickButton != null)
            {
                clickButton.onClick.AddListener(OnClickEarn);
            }

            RefreshCurrencyText();
        }

        private void OnDestroy()
        {
            if (clickButton != null)
            {
                clickButton.onClick.RemoveListener(OnClickEarn);
            }
        }

        public void OnClickEarn()
        {
            currency += clickValue;
            RefreshCurrencyText();
        }

        private void RefreshCurrencyText()
        {
            if (currencyText == null)
            {
                return;
            }

            currencyText.text = $"Gold: {currency}";
        }
    }
}
