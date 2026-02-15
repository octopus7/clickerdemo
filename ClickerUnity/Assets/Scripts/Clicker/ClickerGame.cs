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
        private const string ClickLevelKey = "clicker.click_level";
        private const string AutoIncomeLevelKey = "clicker.auto_income_level";
        private const string LastSeenUnixTimeKey = "clicker.last_seen_unix";
        private const string BuiltinFontPath = "LegacyRuntime.ttf";
        private const int MinimumRecommendedToastPoolCount = 64;
        private const string ToastPoolGroupName = "ToastPool";

        public event Action EconomyChanged;

        [SerializeField] private Text currencyText;
        [SerializeField] private Button clickButton;
        [SerializeField] private Text clickButtonLabelText;
        [SerializeField] private int startingCurrency = 0;
        [Header("Click Upgrade")]
        [SerializeField] private int startingClickLevel = 1;
        [SerializeField] private int clickValuePerLevel = 1;
        [SerializeField] private int clickUpgradeBaseCost = 10;
        [SerializeField] private float clickUpgradeCostGrowth = 1.55f;
        [Header("Auto Income Upgrade")]
        [SerializeField] private int startingAutoIncomeLevel = 1;
        [SerializeField] private int autoIncomePerLevel = 1;
        [SerializeField] private int autoIncomeUpgradeBaseCost = 10;
        [SerializeField] private float autoIncomeUpgradeCostGrowth = 1.6f;
        [Header("Offline Reward")]
        [SerializeField] private float offlineRewardCapHours = 8f;
        [SerializeField] private bool logOfflineRewardSummary = true;
        [Header("Offline Reward UI")]
        [SerializeField] private Text offlineRewardNoticeText;
        [SerializeField] private Vector2 offlineNoticePosition = new Vector2(0f, 320f);
        [SerializeField] private Vector2 offlineNoticeSize = new Vector2(960f, 120f);
        [SerializeField] private int offlineNoticeFontSize = 34;
        [SerializeField] private float offlineNoticeHoldDuration = 5.6f;
        [SerializeField] private float offlineNoticeFadeDuration = 0.45f;
        [SerializeField] private Color offlineNoticeColor = new Color(0.99f, 0.84f, 0.45f, 1f);
        [SerializeField] private Color offlineNoticeCapReachedColor = new Color(1f, 0.58f, 0.22f, 1f);
        [Header("Auto Toast")]
        [SerializeField] private int toastPoolPrewarmCount = 96;
        [SerializeField] private int toastPoolMaxCount = 256;
        [SerializeField] private RectTransform toastParent;
        [SerializeField] private Vector2 autoToastSpawnOffset = new Vector2(0f, 60f);
        [SerializeField] private Vector2 autoToastSize = new Vector2(260f, 70f);
        [SerializeField] private float autoToastDuration = 0.9f;
        [SerializeField] private float autoToastRiseDistance = 110f;
        [SerializeField] private int autoToastFontSize = 40;
        [SerializeField] private Color autoToastColor = new Color(0.47f, 1f, 0.6f, 1f);
        [Header("Click Toast")]
        [SerializeField] private Vector2 clickToastSpawnOffset = new Vector2(0f, 90f);
        [SerializeField] private Vector2 clickToastSize = new Vector2(260f, 70f);
        [SerializeField] private float clickToastDuration = 0.7f;
        [SerializeField] private float clickToastRiseDistance = 90f;
        [SerializeField] private int clickToastFontSize = 38;
        [SerializeField] private Color clickToastColor = new Color(1f, 0.86f, 0.4f, 1f);

        private int currency;
        private int clickLevel;
        private int clickValue;
        private int autoIncomeLevel;
        private int autoIncomePerSecond;
        private int lastOfflineReward;
        private bool lastOfflineRewardWasTimeCapped;
        private long lastOfflineElapsedSeconds;
        private long lastOfflineAppliedSeconds;
        private long lastOfflineCapSeconds;
        private long lastSeenUnixSeconds;
        private float autoIncomeTimer;
        private bool hasReceivedPauseEvent;
        private Coroutine offlineRewardNoticeCoroutine;
        private CanvasGroup offlineRewardNoticeCanvasGroup;
        private RectTransform toastPoolRoot;
        private readonly List<AutoIncomeToastView> autoIncomeToastPool = new List<AutoIncomeToastView>();

        public int ClickLevel => clickLevel;
        public int ClickValue => clickValue;
        public int AutoIncomeLevel => autoIncomeLevel;
        public int AutoIncomePerSecond => autoIncomePerSecond;
        public int CurrentCurrency => currency;

        private sealed class AutoIncomeToastView
        {
            public GameObject GameObject;
            public RectTransform RectTransform;
            public CanvasGroup CanvasGroup;
            public Text Text;
            public Coroutine AnimationCoroutine;
        }

        private enum IncomeToastSource
        {
            Click,
            Auto
        }

        private void Awake()
        {
            LoadState();
            ApplyOfflineReward();

            if (clickButtonLabelText == null && clickButton != null)
            {
                clickButtonLabelText = clickButton.GetComponentInChildren<Text>(true);
            }

            if (clickButton != null)
            {
                clickButton.onClick.AddListener(OnClickEarn);
            }

            PrewarmToastPool();
            NotifyEconomyChanged();
            ShowOfflineRewardNoticeIfNeeded();
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
                hasReceivedPauseEvent = true;
                SaveState();
                return;
            }

            if (!hasReceivedPauseEvent)
            {
                return;
            }

            LoadState();
            ApplyOfflineReward();
            NotifyEconomyChanged();
            ShowOfflineRewardNoticeIfNeeded();
        }

        private void OnApplicationQuit()
        {
            SaveState();
        }

        public void OnClickEarn()
        {
            currency += clickValue;
            ShowClickIncomeToast(clickValue);
            NotifyEconomyChanged();
        }

        public int GetClickUpgradeCost()
        {
            var safeBaseCost = Mathf.Max(1, clickUpgradeBaseCost);
            var safeGrowth = Mathf.Max(1.01f, clickUpgradeCostGrowth);
            var exponent = Mathf.Max(0, clickLevel - 1);

            var calculatedCost = safeBaseCost * Mathf.Pow(safeGrowth, exponent);
            if (calculatedCost >= int.MaxValue)
            {
                return int.MaxValue;
            }

            return Mathf.Max(1, Mathf.RoundToInt(calculatedCost));
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

        public int GetMissingCurrencyForCost(int cost)
        {
            var safeCost = Mathf.Max(0, cost);
            return Mathf.Max(0, safeCost - currency);
        }

        public int GetClickValueAtLevel(int level)
        {
            var safeLevel = Mathf.Max(1, level);
            var safePerLevel = Mathf.Max(1, clickValuePerLevel);
            var valueLong = (long)safeLevel * safePerLevel;
            return valueLong >= int.MaxValue ? int.MaxValue : (int)valueLong;
        }

        public int GetAutoIncomeAtLevel(int level)
        {
            var safeLevel = Mathf.Max(1, level);
            var safePerLevel = Mathf.Max(1, autoIncomePerLevel);
            var valueLong = (long)safeLevel * safePerLevel;
            return valueLong >= int.MaxValue ? int.MaxValue : (int)valueLong;
        }

        public int GetNextClickValue()
        {
            return GetClickValueAtLevel(clickLevel + 1);
        }

        public int GetNextAutoIncomePerSecond()
        {
            return GetAutoIncomeAtLevel(autoIncomeLevel + 1);
        }

        public bool TryUpgradeClickValue()
        {
            var cost = GetClickUpgradeCost();
            if (!CanAfford(cost))
            {
                return false;
            }

            currency -= cost;
            clickLevel += 1;
            RecalculateClickValue();
            SaveState();
            NotifyEconomyChanged();
            return true;
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
            var elapsedSeconds = Math.Max(0L, nowUnixSeconds - lastSeenUnixSeconds);
            var appliedElapsedSeconds = elapsedSeconds;
            var capSeconds = GetOfflineRewardCapSeconds();
            var rewardWasTimeCapped = false;

            if (capSeconds > 0 && appliedElapsedSeconds > capSeconds)
            {
                appliedElapsedSeconds = capSeconds;
                rewardWasTimeCapped = true;
            }

            lastOfflineReward = 0;

            if (autoIncomePerSecond > 0 && appliedElapsedSeconds > 0)
            {
                var rewardLong = appliedElapsedSeconds * autoIncomePerSecond;
                var cappedReward = rewardLong > int.MaxValue ? int.MaxValue : (int)rewardLong;
                currency += cappedReward;
                lastOfflineReward = cappedReward;
            }
            else
            {
                lastOfflineReward = 0;
            }

            lastOfflineRewardWasTimeCapped = rewardWasTimeCapped;
            lastOfflineElapsedSeconds = elapsedSeconds;
            lastOfflineAppliedSeconds = appliedElapsedSeconds;
            lastOfflineCapSeconds = capSeconds;

            LogOfflineRewardSummary(
                elapsedSeconds,
                appliedElapsedSeconds,
                capSeconds,
                rewardWasTimeCapped,
                lastOfflineReward);
            lastSeenUnixSeconds = nowUnixSeconds;
            SaveState();
        }

        private long GetOfflineRewardCapSeconds()
        {
            var safeHours = Mathf.Max(0f, offlineRewardCapHours);
            return (long)Math.Round(safeHours * 3600d);
        }

        private void ShowOfflineRewardNoticeIfNeeded()
        {
            if (lastOfflineReward <= 0)
            {
                if (offlineRewardNoticeCoroutine == null)
                {
                    HideOfflineRewardNoticeImmediate();
                }

                return;
            }

            var noticeText = ResolveOfflineRewardNoticeText();
            if (noticeText == null)
            {
                return;
            }

            var firstLine = $"+{lastOfflineReward} Gold (Offline)";
            var secondLine = lastOfflineRewardWasTimeCapped && lastOfflineCapSeconds > 0
                ? $"Cap reached: {FormatDuration(lastOfflineElapsedSeconds)} -> {FormatDuration(lastOfflineAppliedSeconds)} (Cap {FormatDuration(lastOfflineCapSeconds)})"
                : $"Elapsed: {FormatDuration(lastOfflineAppliedSeconds)}";

            noticeText.text = $"{firstLine}\n{secondLine}";
            noticeText.color = lastOfflineRewardWasTimeCapped ? offlineNoticeCapReachedColor : offlineNoticeColor;
            noticeText.gameObject.SetActive(true);

            if (offlineRewardNoticeCanvasGroup == null)
            {
                offlineRewardNoticeCanvasGroup = GetOrAddOfflineNoticeCanvasGroup(noticeText);
            }

            if (offlineRewardNoticeCanvasGroup != null)
            {
                offlineRewardNoticeCanvasGroup.alpha = 1f;
            }

            if (offlineRewardNoticeCoroutine != null)
            {
                StopCoroutine(offlineRewardNoticeCoroutine);
                offlineRewardNoticeCoroutine = null;
            }

            offlineRewardNoticeCoroutine = StartCoroutine(AnimateOfflineRewardNotice());
        }

        private Text ResolveOfflineRewardNoticeText()
        {
            if (offlineRewardNoticeText != null)
            {
                if (offlineRewardNoticeCanvasGroup == null)
                {
                    offlineRewardNoticeCanvasGroup = GetOrAddOfflineNoticeCanvasGroup(offlineRewardNoticeText);
                }

                return offlineRewardNoticeText;
            }

            var parent = ResolveToastParent();
            if (parent == null)
            {
                return null;
            }

            var noticeObject = new GameObject(
                "OfflineRewardNoticeText",
                typeof(RectTransform),
                typeof(CanvasGroup),
                typeof(Text));
            noticeObject.transform.SetParent(parent, false);
            noticeObject.layer = parent.gameObject.layer;
            noticeObject.SetActive(false);

            var noticeRect = noticeObject.GetComponent<RectTransform>();
            noticeRect.anchorMin = new Vector2(0.5f, 0.5f);
            noticeRect.anchorMax = new Vector2(0.5f, 0.5f);
            noticeRect.pivot = new Vector2(0.5f, 0.5f);
            noticeRect.anchoredPosition = offlineNoticePosition;
            noticeRect.sizeDelta = offlineNoticeSize;

            offlineRewardNoticeCanvasGroup = noticeObject.GetComponent<CanvasGroup>();
            offlineRewardNoticeCanvasGroup.alpha = 0f;

            offlineRewardNoticeText = noticeObject.GetComponent<Text>();
            offlineRewardNoticeText.font = currencyText != null && currencyText.font != null
                ? currencyText.font
                : Resources.GetBuiltinResource<Font>(BuiltinFontPath);
            offlineRewardNoticeText.fontSize = offlineNoticeFontSize;
            offlineRewardNoticeText.alignment = TextAnchor.MiddleCenter;
            offlineRewardNoticeText.horizontalOverflow = HorizontalWrapMode.Wrap;
            offlineRewardNoticeText.verticalOverflow = VerticalWrapMode.Overflow;
            return offlineRewardNoticeText;
        }

        private CanvasGroup GetOrAddOfflineNoticeCanvasGroup(Text noticeText)
        {
            if (noticeText == null)
            {
                return null;
            }

            var canvasGroup = noticeText.GetComponent<CanvasGroup>();
            if (canvasGroup != null)
            {
                return canvasGroup;
            }

            return noticeText.gameObject.AddComponent<CanvasGroup>();
        }

        private void HideOfflineRewardNoticeImmediate()
        {
            if (offlineRewardNoticeCoroutine != null)
            {
                StopCoroutine(offlineRewardNoticeCoroutine);
                offlineRewardNoticeCoroutine = null;
            }

            if (offlineRewardNoticeCanvasGroup != null)
            {
                offlineRewardNoticeCanvasGroup.alpha = 0f;
            }

            if (offlineRewardNoticeText != null)
            {
                offlineRewardNoticeText.gameObject.SetActive(false);
            }
        }

        private IEnumerator AnimateOfflineRewardNotice()
        {
            if (offlineRewardNoticeText == null)
            {
                offlineRewardNoticeCoroutine = null;
                yield break;
            }

            if (offlineRewardNoticeCanvasGroup == null)
            {
                offlineRewardNoticeCanvasGroup = GetOrAddOfflineNoticeCanvasGroup(offlineRewardNoticeText);
            }

            if (offlineRewardNoticeCanvasGroup == null)
            {
                offlineRewardNoticeCoroutine = null;
                yield break;
            }

            var holdDuration = Mathf.Max(0.1f, offlineNoticeHoldDuration);
            var fadeDuration = Mathf.Max(0.1f, offlineNoticeFadeDuration);
            var elapsed = 0f;
            while (elapsed < holdDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                yield return null;
            }

            elapsed = 0f;
            while (elapsed < fadeDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                var normalized = Mathf.Clamp01(elapsed / fadeDuration);
                offlineRewardNoticeCanvasGroup.alpha = 1f - normalized;
                yield return null;
            }

            offlineRewardNoticeCanvasGroup.alpha = 0f;
            offlineRewardNoticeText.gameObject.SetActive(false);
            offlineRewardNoticeCoroutine = null;
        }

        private void LogOfflineRewardSummary(
            long elapsedSeconds,
            long appliedElapsedSeconds,
            long capSeconds,
            bool rewardWasTimeCapped,
            int rewardAmount)
        {
            if (!logOfflineRewardSummary || elapsedSeconds <= 0)
            {
                return;
            }

            if (autoIncomePerSecond <= 0)
            {
                Debug.Log(
                    $"[ClickerGame] Offline reward skipped. Elapsed={FormatDuration(elapsedSeconds)}, auto income is 0/s.");
                return;
            }

            var capText = rewardWasTimeCapped
                ? $" (capped from {FormatDuration(elapsedSeconds)} to {FormatDuration(appliedElapsedSeconds)}, cap={FormatDuration(capSeconds)})"
                : string.Empty;
            Debug.Log(
                $"[ClickerGame] Offline reward +{rewardAmount}. Applied={FormatDuration(appliedElapsedSeconds)}, auto={autoIncomePerSecond}/s{capText}");
        }

        private static string FormatDuration(long totalSeconds)
        {
            var safeSeconds = Math.Max(0L, totalSeconds);
            var duration = TimeSpan.FromSeconds(safeSeconds);

            if (duration.TotalHours >= 1d)
            {
                return $"{(int)duration.TotalHours}h {duration.Minutes}m {duration.Seconds}s";
            }

            if (duration.TotalMinutes >= 1d)
            {
                return $"{duration.Minutes}m {duration.Seconds}s";
            }

            return $"{duration.Seconds}s";
        }

        private void LoadState()
        {
            currency = PlayerPrefs.HasKey(CurrencyKey)
                ? PlayerPrefs.GetInt(CurrencyKey)
                : startingCurrency;

            clickLevel = PlayerPrefs.HasKey(ClickLevelKey)
                ? Mathf.Max(1, PlayerPrefs.GetInt(ClickLevelKey))
                : Mathf.Max(1, startingClickLevel);
            RecalculateClickValue();

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
            PlayerPrefs.SetInt(ClickLevelKey, clickLevel);
            PlayerPrefs.SetInt(AutoIncomeLevelKey, autoIncomeLevel);
            PlayerPrefs.SetString(LastSeenUnixTimeKey, lastSeenUnixSeconds.ToString());
            PlayerPrefs.Save();
        }

        private void RecalculateClickValue()
        {
            clickValue = GetClickValueAtLevel(clickLevel);
        }

        private void RecalculateAutoIncomePerSecond()
        {
            autoIncomePerSecond = GetAutoIncomeAtLevel(autoIncomeLevel);
        }

        private void NotifyEconomyChanged()
        {
            RefreshCurrencyText();
            RefreshClickButtonText();
            EconomyChanged?.Invoke();
        }

        private void ShowAutoIncomeToast(int amount)
        {
            ShowIncomeToast(amount, IncomeToastSource.Auto);
        }

        private void ShowClickIncomeToast(int amount)
        {
            ShowIncomeToast(amount, IncomeToastSource.Click);
        }

        private void ShowIncomeToast(int amount, IncomeToastSource source)
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

            var poolRoot = ResolveToastPoolRoot(parent);
            if (poolRoot == null)
            {
                return;
            }

            var toastView = GetOrCreateToastView(poolRoot);
            if (toastView == null)
            {
                return;
            }

            if (toastView.AnimationCoroutine != null)
            {
                StopCoroutine(toastView.AnimationCoroutine);
                toastView.AnimationCoroutine = null;
            }

            if (toastView.RectTransform.parent != poolRoot)
            {
                toastView.RectTransform.SetParent(poolRoot, false);
            }

            var toastRect = toastView.RectTransform;
            toastView.GameObject.layer = poolRoot.gameObject.layer;
            toastView.GameObject.SetActive(true);
            toastRect.anchorMin = new Vector2(0.5f, 0.5f);
            toastRect.anchorMax = new Vector2(0.5f, 0.5f);
            toastRect.pivot = new Vector2(0.5f, 0.5f);
            toastRect.sizeDelta = source == IncomeToastSource.Auto ? autoToastSize : clickToastSize;
            toastRect.anchoredPosition = GetToastSpawnPosition(poolRoot, source);

            var toastText = toastView.Text;
            toastText.font = currencyText != null && currencyText.font != null
                ? currencyText.font
                : Resources.GetBuiltinResource<Font>(BuiltinFontPath);
            toastText.fontSize = source == IncomeToastSource.Auto ? autoToastFontSize : clickToastFontSize;
            toastText.alignment = TextAnchor.MiddleCenter;
            toastText.horizontalOverflow = HorizontalWrapMode.Overflow;
            toastText.verticalOverflow = VerticalWrapMode.Overflow;
            toastText.color = source == IncomeToastSource.Auto ? autoToastColor : clickToastColor;
            toastText.text = $"+{amount}";

            toastView.CanvasGroup.alpha = 0f;
            var duration = source == IncomeToastSource.Auto ? autoToastDuration : clickToastDuration;
            var riseDistance = source == IncomeToastSource.Auto ? autoToastRiseDistance : clickToastRiseDistance;
            toastView.AnimationCoroutine = StartCoroutine(AnimateAutoIncomeToast(toastView, duration, riseDistance));
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

        private RectTransform ResolveToastPoolRoot(RectTransform parent)
        {
            if (parent == null)
            {
                return null;
            }

            if (toastPoolRoot == null)
            {
                var existingRoot = parent.Find(ToastPoolGroupName) as RectTransform;
                if (existingRoot != null)
                {
                    toastPoolRoot = existingRoot;
                }
                else
                {
                    var rootObject = new GameObject(ToastPoolGroupName, typeof(RectTransform));
                    toastPoolRoot = rootObject.GetComponent<RectTransform>();
                    toastPoolRoot.SetParent(parent, false);
                }
            }

            if (toastPoolRoot.parent != parent)
            {
                toastPoolRoot.SetParent(parent, false);
            }

            toastPoolRoot.gameObject.layer = parent.gameObject.layer;
            toastPoolRoot.anchorMin = Vector2.zero;
            toastPoolRoot.anchorMax = Vector2.one;
            toastPoolRoot.pivot = new Vector2(0.5f, 0.5f);
            toastPoolRoot.offsetMin = Vector2.zero;
            toastPoolRoot.offsetMax = Vector2.zero;
            toastPoolRoot.anchoredPosition = Vector2.zero;
            toastPoolRoot.SetAsLastSibling();
            return toastPoolRoot;
        }

        private Vector2 GetToastSpawnPosition(RectTransform parent, IncomeToastSource source)
        {
            if (source == IncomeToastSource.Click)
            {
                if (clickButton != null &&
                    TryGetToastAnchorPosition(parent, clickButton.GetComponent<RectTransform>(), out var clickAnchorPosition))
                {
                    return clickAnchorPosition + clickToastSpawnOffset;
                }

                return clickToastSpawnOffset;
            }

            if (currencyText != null &&
                TryGetToastAnchorPosition(parent, currencyText.rectTransform, out var currencyAnchorPosition))
            {
                return currencyAnchorPosition + autoToastSpawnOffset;
            }

            return autoToastSpawnOffset;
        }

        private bool TryGetToastAnchorPosition(RectTransform parent, RectTransform sourceRect, out Vector2 anchoredPosition)
        {
            anchoredPosition = Vector2.zero;
            if (parent == null || sourceRect == null)
            {
                return false;
            }

            var eventCamera = ResolveToastEventCamera(parent);
            var sourceCenterWorld = sourceRect.TransformPoint(sourceRect.rect.center);
            var sourceCenterScreen = RectTransformUtility.WorldToScreenPoint(eventCamera, sourceCenterWorld);
            return RectTransformUtility.ScreenPointToLocalPointInRectangle(
                parent,
                sourceCenterScreen,
                eventCamera,
                out anchoredPosition);
        }

        private static Camera ResolveToastEventCamera(RectTransform parent)
        {
            if (parent == null)
            {
                return null;
            }

            var parentCanvas = parent.GetComponentInParent<Canvas>();
            if (parentCanvas == null || parentCanvas.renderMode == RenderMode.ScreenSpaceOverlay)
            {
                return null;
            }

            return parentCanvas.worldCamera;
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

            var safePoolMaxCount = Mathf.Clamp(
                Mathf.Max(toastPoolMaxCount, MinimumRecommendedToastPoolCount),
                MinimumRecommendedToastPoolCount,
                1024);
            if (autoIncomeToastPool.Count >= safePoolMaxCount)
            {
                return autoIncomeToastPool[0];
            }

            var toastView = CreateToastView(parent);
            autoIncomeToastPool.Add(toastView);
            return toastView;
        }

        private AutoIncomeToastView CreateToastView(RectTransform parent)
        {
            var toastObject = new GameObject(
                "IncomeToast",
                typeof(RectTransform),
                typeof(CanvasGroup),
                typeof(Text));
            toastObject.transform.SetParent(parent, false);
            toastObject.layer = parent.gameObject.layer;
            toastObject.SetActive(false);

            return new AutoIncomeToastView
            {
                GameObject = toastObject,
                RectTransform = toastObject.GetComponent<RectTransform>(),
                CanvasGroup = toastObject.GetComponent<CanvasGroup>(),
                Text = toastObject.GetComponent<Text>(),
                AnimationCoroutine = null
            };
        }

        private void PrewarmToastPool()
        {
            var parent = ResolveToastParent();
            if (parent == null)
            {
                return;
            }

            var poolRoot = ResolveToastPoolRoot(parent);
            if (poolRoot == null)
            {
                return;
            }

            var safePoolMaxCount = Mathf.Clamp(
                Mathf.Max(toastPoolMaxCount, MinimumRecommendedToastPoolCount),
                MinimumRecommendedToastPoolCount,
                1024);
            var targetCount = Mathf.Clamp(
                Mathf.Max(toastPoolPrewarmCount, MinimumRecommendedToastPoolCount),
                MinimumRecommendedToastPoolCount,
                safePoolMaxCount);
            while (autoIncomeToastPool.Count < targetCount)
            {
                autoIncomeToastPool.Add(CreateToastView(poolRoot));
            }
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

            currencyText.text =
                $"Gold: {currency}\nClick: +{Mathf.Max(0, clickValue)}\nAuto: +{Mathf.Max(0, autoIncomePerSecond)}/s";
            if (lastOfflineReward > 0)
            {
                var capText = lastOfflineRewardWasTimeCapped && lastOfflineCapSeconds > 0
                    ? $" (Cap {FormatDuration(lastOfflineCapSeconds)})"
                    : string.Empty;
                currencyText.text += $"\nOffline +{lastOfflineReward}{capText}";
            }
        }

        private void RefreshClickButtonText()
        {
            if (clickButtonLabelText == null)
            {
                return;
            }

            clickButtonLabelText.text = $"+{Mathf.Max(0, clickValue)} Gold";
        }
    }
}
