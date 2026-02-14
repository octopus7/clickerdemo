using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace ClickerUnity
{
    public class ClickerGame : MonoBehaviour
    {
        private const string CurrencyKey = "clicker.currency";
        private const string AutoIncomeLevelKey = "clicker.auto_income_level";
        private const string LastSeenUnixTimeKey = "clicker.last_seen_unix";
        private const string BuiltinFontPath = "LegacyRuntime.ttf";

        public event Action EconomyChanged;

        [SerializeField] private Text currencyText;
        [SerializeField] private Button clickButton;
        [SerializeField] private int startingCurrency = 0;
        [SerializeField] private int clickValue = 1;
        [Header("Auto Income Upgrade")]
        [SerializeField] private int startingAutoIncomeLevel = 1;
        [SerializeField] private int autoIncomePerLevel = 1;
        [SerializeField] private int autoIncomeUpgradeBaseCost = 10;
        [SerializeField] private float autoIncomeUpgradeCostGrowth = 1.6f;
        [Header("Auto Toast")]
        [SerializeField] private RectTransform toastParent;
        [SerializeField] private Vector2 autoToastSpawnOffset = new Vector2(0f, 60f);
        [SerializeField] private Vector2 autoToastSize = new Vector2(260f, 70f);
        [SerializeField] private float autoToastDuration = 0.9f;
        [SerializeField] private float autoToastRiseDistance = 110f;
        [SerializeField] private int autoToastFontSize = 40;
        [SerializeField] private Color autoToastColor = new Color(0.47f, 1f, 0.6f, 1f);

        private int currency;
        private int autoIncomeLevel;
        private int autoIncomePerSecond;
        private int lastOfflineReward;
        private long lastSeenUnixSeconds;
        private float autoIncomeTimer;
        private readonly List<AutoIncomeToastView> autoIncomeToastPool = new List<AutoIncomeToastView>();

        public int AutoIncomeLevel => autoIncomeLevel;
        public int AutoIncomePerSecond => autoIncomePerSecond;

        private sealed class AutoIncomeToastView
        {
            public GameObject GameObject;
            public RectTransform RectTransform;
            public CanvasGroup CanvasGroup;
            public Text Text;
            public Coroutine AnimationCoroutine;
        }

        private void Awake()
        {
            LoadState();
            ApplyOfflineReward();

            if (clickButton != null)
            {
                clickButton.onClick.AddListener(OnClickEarn);
            }

            NotifyEconomyChanged();
        }

        private void OnDestroy()
        {
            if (clickButton != null)
            {
                clickButton.onClick.RemoveListener(OnClickEarn);
            }

            for (var i = 0; i < autoIncomeToastPool.Count; i++)
            {
                var toastView = autoIncomeToastPool[i];
                if (toastView == null)
                {
                    continue;
                }

                if (toastView.AnimationCoroutine != null)
                {
                    StopCoroutine(toastView.AnimationCoroutine);
                    toastView.AnimationCoroutine = null;
                }

                if (toastView.GameObject != null)
                {
                    Destroy(toastView.GameObject);
                }
            }

            autoIncomeToastPool.Clear();
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
            NotifyEconomyChanged();
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
            NotifyEconomyChanged();
        }

        private void OnApplicationQuit()
        {
            SaveState();
        }

        public void OnClickEarn()
        {
            currency += clickValue;
            NotifyEconomyChanged();
        }

        public int GetAutoIncomeUpgradeCost()
        {
            var safeBaseCost = Mathf.Max(1, autoIncomeUpgradeBaseCost);
            var safeGrowth = Mathf.Max(1.01f, autoIncomeUpgradeCostGrowth);
            var exponent = Mathf.Max(0, autoIncomeLevel - 1);

            var calculatedCost = safeBaseCost * Mathf.Pow(safeGrowth, exponent);
            if (calculatedCost >= int.MaxValue)
            {
                return int.MaxValue;
            }

            return Mathf.Max(1, Mathf.RoundToInt(calculatedCost));
        }

        public bool CanAfford(int cost)
        {
            return currency >= Mathf.Max(0, cost);
        }

        public bool TryUpgradeAutoIncome()
        {
            var cost = GetAutoIncomeUpgradeCost();
            if (!CanAfford(cost))
            {
                return false;
            }

            currency -= cost;
            autoIncomeLevel += 1;
            RecalculateAutoIncomePerSecond();
            SaveState();
            NotifyEconomyChanged();
            return true;
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

            autoIncomeLevel = PlayerPrefs.HasKey(AutoIncomeLevelKey)
                ? Mathf.Max(1, PlayerPrefs.GetInt(AutoIncomeLevelKey))
                : Mathf.Max(1, startingAutoIncomeLevel);
            RecalculateAutoIncomePerSecond();

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
            PlayerPrefs.SetInt(AutoIncomeLevelKey, autoIncomeLevel);
            PlayerPrefs.SetString(LastSeenUnixTimeKey, lastSeenUnixSeconds.ToString());
            PlayerPrefs.Save();
        }

        private void RecalculateAutoIncomePerSecond()
        {
            var safeLevel = Mathf.Max(1, autoIncomeLevel);
            var safePerLevel = Mathf.Max(1, autoIncomePerLevel);
            autoIncomePerSecond = safeLevel * safePerLevel;
        }

        private void NotifyEconomyChanged()
        {
            RefreshCurrencyText();
            EconomyChanged?.Invoke();
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

            var toastView = GetOrCreateToastView(parent);
            if (toastView == null)
            {
                return;
            }

            if (toastView.AnimationCoroutine != null)
            {
                StopCoroutine(toastView.AnimationCoroutine);
                toastView.AnimationCoroutine = null;
            }

            if (toastView.RectTransform.parent != parent)
            {
                toastView.RectTransform.SetParent(parent, false);
            }

            var toastRect = toastView.RectTransform;
            toastView.GameObject.layer = parent.gameObject.layer;
            toastView.GameObject.SetActive(true);
            toastRect.anchorMin = new Vector2(0.5f, 0.5f);
            toastRect.anchorMax = new Vector2(0.5f, 0.5f);
            toastRect.pivot = new Vector2(0.5f, 0.5f);
            toastRect.sizeDelta = autoToastSize;
            toastRect.anchoredPosition = GetToastSpawnPosition(parent);

            var toastText = toastView.Text;
            toastText.font = currencyText != null && currencyText.font != null
                ? currencyText.font
                : Resources.GetBuiltinResource<Font>(BuiltinFontPath);
            toastText.fontSize = autoToastFontSize;
            toastText.alignment = TextAnchor.MiddleCenter;
            toastText.horizontalOverflow = HorizontalWrapMode.Overflow;
            toastText.verticalOverflow = VerticalWrapMode.Overflow;
            toastText.color = autoToastColor;
            toastText.text = $"+{amount}";

            toastView.CanvasGroup.alpha = 0f;
            toastView.AnimationCoroutine = StartCoroutine(AnimateAutoIncomeToast(toastView, autoToastDuration, autoToastRiseDistance));
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

        private AutoIncomeToastView GetOrCreateToastView(RectTransform parent)
        {
            for (var i = 0; i < autoIncomeToastPool.Count; i++)
            {
                var pooledToast = autoIncomeToastPool[i];
                if (pooledToast != null && pooledToast.GameObject != null && !pooledToast.GameObject.activeSelf)
                {
                    return pooledToast;
                }
            }

            var toastObject = new GameObject(
                "AutoIncomeToast",
                typeof(RectTransform),
                typeof(CanvasGroup),
                typeof(Text));
            toastObject.transform.SetParent(parent, false);
            toastObject.layer = parent.gameObject.layer;
            toastObject.SetActive(false);

            var toastView = new AutoIncomeToastView
            {
                GameObject = toastObject,
                RectTransform = toastObject.GetComponent<RectTransform>(),
                CanvasGroup = toastObject.GetComponent<CanvasGroup>(),
                Text = toastObject.GetComponent<Text>(),
                AnimationCoroutine = null
            };

            autoIncomeToastPool.Add(toastView);
            return toastView;
        }

        private IEnumerator AnimateAutoIncomeToast(
            AutoIncomeToastView toastView,
            float duration,
            float riseDistance)
        {
            if (toastView == null || toastView.GameObject == null || toastView.RectTransform == null || toastView.CanvasGroup == null)
            {
                yield break;
            }

            var elapsed = 0f;
            var toastRect = toastView.RectTransform;
            var canvasGroup = toastView.CanvasGroup;
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

            if (toastView.GameObject != null)
            {
                canvasGroup.alpha = 0f;
                toastView.GameObject.SetActive(false);
            }

            toastView.AnimationCoroutine = null;
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
