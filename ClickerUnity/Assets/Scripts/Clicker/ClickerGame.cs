using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace ClickerUnity
{
    public class ClickerGame : MonoBehaviour
    {
        private const string CurrencyKey = "clicker.currency";
        private const string LastSeenUnixTimeKey = "clicker.last_seen_unix";
        private const string BuiltinFontPath = "LegacyRuntime.ttf";

        [SerializeField] private Text currencyText;
        [SerializeField] private Button clickButton;
        [SerializeField] private int startingCurrency = 0;
        [SerializeField] private int clickValue = 1;
        [SerializeField] private int autoIncomePerSecond = 1;
        [Header("Auto Toast")]
        [SerializeField] private RectTransform toastParent;
        [SerializeField] private Vector2 autoToastSpawnOffset = new Vector2(0f, 60f);
        [SerializeField] private Vector2 autoToastSize = new Vector2(260f, 70f);
        [SerializeField] private float autoToastDuration = 0.9f;
        [SerializeField] private float autoToastRiseDistance = 110f;
        [SerializeField] private int autoToastFontSize = 40;
        [SerializeField] private Color autoToastColor = new Color(0.47f, 1f, 0.6f, 1f);

        private int currency;
        private int lastOfflineReward;
        private long lastSeenUnixSeconds;
        private float autoIncomeTimer;

        private void Awake()
        {
            LoadState();
            ApplyOfflineReward();

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

        private void Update()
        {
            if (autoIncomePerSecond <= 0)
            {
                return;
            }

            autoIncomeTimer += Time.unscaledDeltaTime;
            if (autoIncomeTimer < 1f)
            {
                return;
            }

            var wholeSeconds = Mathf.FloorToInt(autoIncomeTimer);
            autoIncomeTimer -= wholeSeconds;

            var gain = wholeSeconds * autoIncomePerSecond;
            if (gain <= 0)
            {
                return;
            }

            currency += gain;
            ShowAutoIncomeToast(gain);
            RefreshCurrencyText();
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                SaveState();
                return;
            }

            LoadState();
            ApplyOfflineReward();
            RefreshCurrencyText();
        }

        private void OnApplicationQuit()
        {
            SaveState();
        }

        public void OnClickEarn()
        {
            currency += clickValue;
            RefreshCurrencyText();
        }

        private void ApplyOfflineReward()
        {
            var nowUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var elapsedSeconds = Mathf.Max(0L, nowUnixSeconds - lastSeenUnixSeconds);
            lastOfflineReward = 0;

            if (autoIncomePerSecond > 0 && elapsedSeconds > 0)
            {
                var rewardLong = elapsedSeconds * autoIncomePerSecond;
                var cappedReward = rewardLong > int.MaxValue ? int.MaxValue : (int)rewardLong;
                currency += cappedReward;
                lastOfflineReward = cappedReward;
            }

            lastSeenUnixSeconds = nowUnixSeconds;
            SaveState();
        }

        private void LoadState()
        {
            currency = PlayerPrefs.HasKey(CurrencyKey)
                ? PlayerPrefs.GetInt(CurrencyKey)
                : startingCurrency;

            if (PlayerPrefs.HasKey(LastSeenUnixTimeKey))
            {
                var savedUnixText = PlayerPrefs.GetString(LastSeenUnixTimeKey);
                if (!long.TryParse(savedUnixText, out lastSeenUnixSeconds))
                {
                    lastSeenUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                }
            }
            else
            {
                lastSeenUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            }
        }

        private void SaveState()
        {
            lastSeenUnixSeconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            PlayerPrefs.SetInt(CurrencyKey, currency);
            PlayerPrefs.SetString(LastSeenUnixTimeKey, lastSeenUnixSeconds.ToString());
            PlayerPrefs.Save();
        }

        private void ShowAutoIncomeToast(int amount)
        {
            if (amount <= 0)
            {
                return;
            }

            var parent = ResolveToastParent();
            if (parent == null)
            {
                return;
            }

            var toastObject = new GameObject(
                "AutoIncomeToast",
                typeof(RectTransform),
                typeof(CanvasGroup),
                typeof(Text));
            toastObject.transform.SetParent(parent, false);

            var toastRect = toastObject.GetComponent<RectTransform>();
            toastRect.anchorMin = new Vector2(0.5f, 0.5f);
            toastRect.anchorMax = new Vector2(0.5f, 0.5f);
            toastRect.pivot = new Vector2(0.5f, 0.5f);
            toastRect.sizeDelta = autoToastSize;
            toastRect.anchoredPosition = GetToastSpawnPosition(parent);

            var toastText = toastObject.GetComponent<Text>();
            toastText.font = currencyText != null && currencyText.font != null
                ? currencyText.font
                : Resources.GetBuiltinResource<Font>(BuiltinFontPath);
            toastText.fontSize = autoToastFontSize;
            toastText.alignment = TextAnchor.MiddleCenter;
            toastText.horizontalOverflow = HorizontalWrapMode.Overflow;
            toastText.verticalOverflow = VerticalWrapMode.Overflow;
            toastText.color = autoToastColor;
            toastText.text = $"+{amount}";

            var canvasGroup = toastObject.GetComponent<CanvasGroup>();
            canvasGroup.alpha = 0f;
            StartCoroutine(AnimateAutoIncomeToast(toastObject, toastRect, canvasGroup, autoToastDuration, autoToastRiseDistance));
        }

        private RectTransform ResolveToastParent()
        {
            if (toastParent != null)
            {
                return toastParent;
            }

            if (currencyText != null && currencyText.rectTransform.parent is RectTransform rectParent)
            {
                return rectParent;
            }

            return null;
        }

        private Vector2 GetToastSpawnPosition(RectTransform parent)
        {
            if (currencyText != null && currencyText.rectTransform.parent == parent)
            {
                return currencyText.rectTransform.anchoredPosition + autoToastSpawnOffset;
            }

            return autoToastSpawnOffset;
        }

        private IEnumerator AnimateAutoIncomeToast(
            GameObject toastObject,
            RectTransform toastRect,
            CanvasGroup canvasGroup,
            float duration,
            float riseDistance)
        {
            var elapsed = 0f;
            var startPosition = toastRect.anchoredPosition;
            var safeDuration = Mathf.Max(0.15f, duration);
            var safeRiseDistance = Mathf.Max(0f, riseDistance);

            toastRect.localScale = Vector3.one * 0.2f;
            canvasGroup.alpha = 1f;

            while (elapsed < safeDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                var normalizedTime = Mathf.Clamp01(elapsed / safeDuration);

                var scaleTime = Mathf.Clamp01(normalizedTime / 0.5f);
                var scaleFactor = Mathf.LerpUnclamped(0.2f, 1f, EaseOutElastic(scaleTime));
                toastRect.localScale = new Vector3(scaleFactor, scaleFactor, 1f);

                var moveFactor = EaseOutCubic(normalizedTime);
                toastRect.anchoredPosition = startPosition + Vector2.up * (safeRiseDistance * moveFactor);

                var fadeTime = Mathf.Clamp01((normalizedTime - 0.15f) / 0.85f);
                canvasGroup.alpha = 1f - fadeTime;

                yield return null;
            }

            if (toastObject != null)
            {
                Destroy(toastObject);
            }
        }

        private static float EaseOutCubic(float t)
        {
            var inv = 1f - t;
            return 1f - inv * inv * inv;
        }

        private static float EaseOutElastic(float t)
        {
            if (t <= 0f)
            {
                return 0f;
            }

            if (t >= 1f)
            {
                return 1f;
            }

            const float c4 = (2f * Mathf.PI) / 3f;
            return Mathf.Pow(2f, -10f * t) * Mathf.Sin((t * 10f - 0.75f) * c4) + 1f;
        }

        private void RefreshCurrencyText()
        {
            if (currencyText == null)
            {
                return;
            }

            currencyText.text = $"Gold: {currency}\nAuto: +{Mathf.Max(0, autoIncomePerSecond)}/s";
            if (lastOfflineReward > 0)
            {
                currencyText.text += $"\nOffline +{lastOfflineReward}";
            }
        }
    }
}
