using ClickerUnity;
using UnityEditor;
using UnityEngine;
using UnityEngine.UI;

public static class UpgradePanelPrefabBuilder
{
    public const string PrefabDirectory = "Assets/Prefabs/Clicker";
    public const string PrefabPath = "Assets/Prefabs/Clicker/UpgradePanel.prefab";
    private const string BuiltinFontPath = "LegacyRuntime.ttf";

    [MenuItem("Tools/Create Upgrade Panel Prefab", false, 100)]
    public static void CreateUpgradePanelPrefabMenu()
    {
        CreateUpgradePanelPrefab(true);
    }

    public static bool CreateUpgradePanelPrefab(bool showDialog)
    {
        EnsurePrefabFolder();

        var root = BuildPrefabRoot();
        var prefab = PrefabUtility.SaveAsPrefabAsset(root, PrefabPath, out var success);
        Object.DestroyImmediate(root);
        AssetDatabase.Refresh();

        if (!success || prefab == null)
        {
            if (showDialog)
            {
                EditorUtility.DisplayDialog("Upgrade Panel Prefab", $"Failed to create prefab: {PrefabPath}", "OK");
            }

            return false;
        }

        if (showDialog)
        {
            EditorGUIUtility.PingObject(prefab);
            EditorUtility.DisplayDialog("Upgrade Panel Prefab", $"Prefab created: {PrefabPath}", "OK");
        }

        return true;
    }

    public static bool TryInstantiatePrefabInScene(Transform parent, int uiLayer, out UpgradePanelController panelController)
    {
        panelController = null;

        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(PrefabPath);
        if (prefab == null)
        {
            return false;
        }

        var instance = PrefabUtility.InstantiatePrefab(prefab, parent) as GameObject;
        if (instance == null)
        {
            return false;
        }

        if (uiLayer >= 0)
        {
            SetLayerRecursively(instance, uiLayer);
        }

        panelController = instance.GetComponent<UpgradePanelController>();
        if (panelController == null)
        {
            panelController = instance.AddComponent<UpgradePanelController>();
        }

        return true;
    }

    private static GameObject BuildPrefabRoot()
    {
        const float headerHeight = 100f;
        const float panelPadding = 20f;

        var uiLayer = LayerMask.NameToLayer("UI");
        var root = new GameObject("UpgradePanel", typeof(RectTransform), typeof(Image), typeof(UpgradePanelController));
        var rootRect = root.GetComponent<RectTransform>();
        StretchToParent(rootRect);
        rootRect.offsetMin = Vector2.zero;
        rootRect.offsetMax = Vector2.zero;

        var dimImage = root.GetComponent<Image>();
        dimImage.color = new Color(0f, 0f, 0f, 0.62f);

        var window = CreateUiObject("Window", root.transform, new Vector2(840f, 760f), Vector2.zero);
        var windowImage = window.AddComponent<Image>();
        windowImage.color = new Color(0.08f, 0.11f, 0.16f, 0.96f);

        var title = CreateUiObject("Title", window.transform, new Vector2(0f, headerHeight), new Vector2(0f, -panelPadding), new Vector2(0f, 1f), new Vector2(1f, 1f));
        var titleRect = title.GetComponent<RectTransform>();
        titleRect.pivot = new Vector2(0.5f, 1f);
        var titleText = title.AddComponent<Text>();
        titleText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        titleText.fontSize = 46;
        titleText.alignment = TextAnchor.MiddleLeft;
        titleText.color = Color.white;
        titleText.text = "Upgrades";

        var closeButton = CreateUiObject("CloseButton", window.transform, new Vector2(64f, 64f), new Vector2(-panelPadding, -panelPadding), new Vector2(1f, 1f), new Vector2(1f, 1f));
        var closeButtonRect = closeButton.GetComponent<RectTransform>();
        closeButtonRect.pivot = new Vector2(1f, 1f);
        var closeButtonImage = closeButton.AddComponent<Image>();
        closeButtonImage.color = new Color(0.78f, 0.24f, 0.24f, 1f);
        var closeButtonComponent = closeButton.AddComponent<Button>();
        closeButtonComponent.targetGraphic = closeButtonImage;

        var closeLabel = CreateUiObject("Label", closeButton.transform, Vector2.zero, Vector2.zero, Vector2.zero, Vector2.one);
        var closeLabelText = closeLabel.AddComponent<Text>();
        closeLabelText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        closeLabelText.fontSize = 38;
        closeLabelText.alignment = TextAnchor.MiddleCenter;
        closeLabelText.color = Color.white;
        closeLabelText.text = "X";

        var scrollView = CreateUiObject("ScrollView", window.transform, Vector2.zero, Vector2.zero, new Vector2(0f, 0f), new Vector2(1f, 1f));
        var scrollViewRect = scrollView.GetComponent<RectTransform>();
        scrollViewRect.offsetMin = new Vector2(panelPadding, panelPadding);
        scrollViewRect.offsetMax = new Vector2(-panelPadding, -headerHeight - panelPadding);
        var scrollViewImage = scrollView.AddComponent<Image>();
        scrollViewImage.color = new Color(0.12f, 0.16f, 0.22f, 1f);
        var scrollRect = scrollView.AddComponent<ScrollRect>();
        scrollRect.horizontal = false;
        scrollRect.vertical = true;
        scrollRect.movementType = ScrollRect.MovementType.Clamped;
        scrollRect.scrollSensitivity = 32f;

        var viewport = CreateUiObject("Viewport", scrollView.transform, Vector2.zero, Vector2.zero, Vector2.zero, Vector2.one);
        var viewportImage = viewport.AddComponent<Image>();
        viewportImage.color = new Color(1f, 1f, 1f, 0.01f);
        viewport.AddComponent<Mask>().showMaskGraphic = false;

        var content = CreateUiObject("Content", viewport.transform, Vector2.zero, Vector2.zero, new Vector2(0f, 1f), new Vector2(1f, 1f));
        var contentRect = content.GetComponent<RectTransform>();
        contentRect.pivot = new Vector2(0.5f, 1f);
        contentRect.anchoredPosition = Vector2.zero;
        contentRect.sizeDelta = new Vector2(0f, 0f);

        var contentLayout = content.AddComponent<VerticalLayoutGroup>();
        contentLayout.childControlWidth = true;
        contentLayout.childControlHeight = true;
        contentLayout.childForceExpandWidth = true;
        contentLayout.childForceExpandHeight = false;
        contentLayout.spacing = 12f;
        contentLayout.padding = new RectOffset(16, 16, 16, 16);

        var contentFitter = content.AddComponent<ContentSizeFitter>();
        contentFitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
        contentFitter.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;

        scrollRect.viewport = viewport.GetComponent<RectTransform>();
        scrollRect.content = contentRect;

        var clickUpgradeItemView = CreateClickUpgradeItem(content.transform);
        var autoIncomeUpgradeItemView = CreateAutoIncomeUpgradeItem(content.transform);

        title.transform.SetAsLastSibling();
        closeButton.transform.SetAsLastSibling();

        if (uiLayer >= 0)
        {
            SetLayerRecursively(root, uiLayer);
        }

        var panelController = root.GetComponent<UpgradePanelController>();
        var serializedPanel = new SerializedObject(panelController);
        serializedPanel.FindProperty("panelRoot").objectReferenceValue = root;
        serializedPanel.FindProperty("closeButton").objectReferenceValue = closeButtonComponent;
        serializedPanel.FindProperty("clickUpgradeItemView").objectReferenceValue = clickUpgradeItemView;
        serializedPanel.FindProperty("autoIncomeUpgradeItemView").objectReferenceValue = autoIncomeUpgradeItemView;
        serializedPanel.FindProperty("startHidden").boolValue = true;
        serializedPanel.ApplyModifiedPropertiesWithoutUndo();

        return root;
    }

    private static AutoIncomeUpgradeItemView CreateAutoIncomeUpgradeItem(Transform parent)
    {
        var item = CreateUiObject("AutoIncomeItem", parent, new Vector2(0f, 132f), Vector2.zero, new Vector2(0f, 1f), new Vector2(1f, 1f));
        var itemRect = item.GetComponent<RectTransform>();
        itemRect.pivot = new Vector2(0.5f, 1f);

        var itemImage = item.AddComponent<Image>();
        itemImage.color = new Color(0.16f, 0.21f, 0.28f, 1f);

        var layoutElement = item.AddComponent<LayoutElement>();
        layoutElement.minHeight = 132f;
        layoutElement.preferredHeight = 132f;

        var titleTextObject = CreateUiObject("Name", item.transform, Vector2.zero, Vector2.zero, new Vector2(0f, 0.5f), new Vector2(0.7f, 1f));
        var titleRect = titleTextObject.GetComponent<RectTransform>();
        titleRect.offsetMin = new Vector2(16f, 0f);
        titleRect.offsetMax = new Vector2(0f, -8f);
        var titleText = titleTextObject.AddComponent<Text>();
        titleText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        titleText.fontSize = 28;
        titleText.alignment = TextAnchor.MiddleLeft;
        titleText.color = Color.white;
        titleText.text = "Auto Income";

        var levelTextObject = CreateUiObject("CurrentLevel", item.transform, Vector2.zero, Vector2.zero, new Vector2(0.55f, 0.5f), new Vector2(1f, 1f));
        var levelRect = levelTextObject.GetComponent<RectTransform>();
        levelRect.offsetMin = new Vector2(0f, 0f);
        levelRect.offsetMax = new Vector2(-16f, -8f);
        var levelText = levelTextObject.AddComponent<Text>();
        levelText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        levelText.fontSize = 24;
        levelText.alignment = TextAnchor.MiddleRight;
        levelText.color = new Color(0.9f, 0.95f, 1f, 1f);
        levelText.text = "Current Lv.1";

        var detailTextObject = CreateUiObject("Details", item.transform, Vector2.zero, Vector2.zero, new Vector2(0f, 0f), new Vector2(1f, 0.5f));
        var detailRect = detailTextObject.GetComponent<RectTransform>();
        detailRect.offsetMin = new Vector2(16f, 8f);
        detailRect.offsetMax = new Vector2(-170f, 0f);
        var detailText = detailTextObject.AddComponent<Text>();
        detailText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        detailText.fontSize = 22;
        detailText.alignment = TextAnchor.MiddleLeft;
        detailText.color = new Color(0.72f, 0.9f, 1f, 1f);
        detailText.text = "Effect: +1/s   Next Cost: 10";

        var upgradeButtonObject = CreateUiObject("UpgradeButton", item.transform, new Vector2(140f, 48f), new Vector2(-16f, 8f), new Vector2(1f, 0f), new Vector2(1f, 0f));
        var upgradeButtonRect = upgradeButtonObject.GetComponent<RectTransform>();
        upgradeButtonRect.pivot = new Vector2(1f, 0f);

        var upgradeButtonImage = upgradeButtonObject.AddComponent<Image>();
        upgradeButtonImage.color = new Color(0.22f, 0.64f, 0.32f, 1f);
        var upgradeButton = upgradeButtonObject.AddComponent<Button>();
        upgradeButton.targetGraphic = upgradeButtonImage;

        var buttonLabelObject = CreateUiObject("Label", upgradeButtonObject.transform, Vector2.zero, Vector2.zero, Vector2.zero, Vector2.one);
        var buttonLabel = buttonLabelObject.AddComponent<Text>();
        buttonLabel.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        buttonLabel.fontSize = 24;
        buttonLabel.alignment = TextAnchor.MiddleCenter;
        buttonLabel.color = Color.white;
        buttonLabel.text = "Upgrade";

        var itemView = item.AddComponent<AutoIncomeUpgradeItemView>();
        var serializedItemView = new SerializedObject(itemView);
        serializedItemView.FindProperty("currentLevelText").objectReferenceValue = levelText;
        serializedItemView.FindProperty("detailsText").objectReferenceValue = detailText;
        serializedItemView.FindProperty("upgradeButton").objectReferenceValue = upgradeButton;
        serializedItemView.FindProperty("upgradeButtonLabel").objectReferenceValue = buttonLabel;
        serializedItemView.ApplyModifiedPropertiesWithoutUndo();

        return itemView;
    }

    private static ClickUpgradeItemView CreateClickUpgradeItem(Transform parent)
    {
        var item = CreateUiObject("ClickUpgradeItem", parent, new Vector2(0f, 132f), Vector2.zero, new Vector2(0f, 1f), new Vector2(1f, 1f));
        var itemRect = item.GetComponent<RectTransform>();
        itemRect.pivot = new Vector2(0.5f, 1f);

        var itemImage = item.AddComponent<Image>();
        itemImage.color = new Color(0.16f, 0.21f, 0.28f, 1f);

        var layoutElement = item.AddComponent<LayoutElement>();
        layoutElement.minHeight = 132f;
        layoutElement.preferredHeight = 132f;

        var titleTextObject = CreateUiObject("Name", item.transform, Vector2.zero, Vector2.zero, new Vector2(0f, 0.5f), new Vector2(0.7f, 1f));
        var titleRect = titleTextObject.GetComponent<RectTransform>();
        titleRect.offsetMin = new Vector2(16f, 0f);
        titleRect.offsetMax = new Vector2(0f, -8f);
        var titleText = titleTextObject.AddComponent<Text>();
        titleText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        titleText.fontSize = 28;
        titleText.alignment = TextAnchor.MiddleLeft;
        titleText.color = Color.white;
        titleText.text = "Click Power";

        var levelTextObject = CreateUiObject("CurrentLevel", item.transform, Vector2.zero, Vector2.zero, new Vector2(0.55f, 0.5f), new Vector2(1f, 1f));
        var levelRect = levelTextObject.GetComponent<RectTransform>();
        levelRect.offsetMin = new Vector2(0f, 0f);
        levelRect.offsetMax = new Vector2(-16f, -8f);
        var levelText = levelTextObject.AddComponent<Text>();
        levelText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        levelText.fontSize = 24;
        levelText.alignment = TextAnchor.MiddleRight;
        levelText.color = new Color(0.9f, 0.95f, 1f, 1f);
        levelText.text = "Current Lv.1";

        var detailTextObject = CreateUiObject("Details", item.transform, Vector2.zero, Vector2.zero, new Vector2(0f, 0f), new Vector2(1f, 0.5f));
        var detailRect = detailTextObject.GetComponent<RectTransform>();
        detailRect.offsetMin = new Vector2(16f, 8f);
        detailRect.offsetMax = new Vector2(-170f, 0f);
        var detailText = detailTextObject.AddComponent<Text>();
        detailText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        detailText.fontSize = 22;
        detailText.alignment = TextAnchor.MiddleLeft;
        detailText.color = new Color(1f, 0.83f, 0.6f, 1f);
        detailText.text = "Effect: +1/click   Next Cost: 10";

        var upgradeButtonObject = CreateUiObject("UpgradeButton", item.transform, new Vector2(140f, 48f), new Vector2(-16f, 8f), new Vector2(1f, 0f), new Vector2(1f, 0f));
        var upgradeButtonRect = upgradeButtonObject.GetComponent<RectTransform>();
        upgradeButtonRect.pivot = new Vector2(1f, 0f);

        var upgradeButtonImage = upgradeButtonObject.AddComponent<Image>();
        upgradeButtonImage.color = new Color(0.78f, 0.48f, 0.19f, 1f);
        var upgradeButton = upgradeButtonObject.AddComponent<Button>();
        upgradeButton.targetGraphic = upgradeButtonImage;

        var buttonLabelObject = CreateUiObject("Label", upgradeButtonObject.transform, Vector2.zero, Vector2.zero, Vector2.zero, Vector2.one);
        var buttonLabel = buttonLabelObject.AddComponent<Text>();
        buttonLabel.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        buttonLabel.fontSize = 24;
        buttonLabel.alignment = TextAnchor.MiddleCenter;
        buttonLabel.color = Color.white;
        buttonLabel.text = "Upgrade";

        var itemView = item.AddComponent<ClickUpgradeItemView>();
        var serializedItemView = new SerializedObject(itemView);
        serializedItemView.FindProperty("currentLevelText").objectReferenceValue = levelText;
        serializedItemView.FindProperty("detailsText").objectReferenceValue = detailText;
        serializedItemView.FindProperty("upgradeButton").objectReferenceValue = upgradeButton;
        serializedItemView.FindProperty("upgradeButtonLabel").objectReferenceValue = buttonLabel;
        serializedItemView.ApplyModifiedPropertiesWithoutUndo();

        return itemView;
    }

    private static GameObject CreateUiObject(string objectName, Transform parent, Vector2 size, Vector2 anchoredPosition)
    {
        return CreateUiObject(objectName, parent, size, anchoredPosition, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f));
    }

    private static GameObject CreateUiObject(
        string objectName,
        Transform parent,
        Vector2 size,
        Vector2 anchoredPosition,
        Vector2 anchorMin,
        Vector2 anchorMax)
    {
        var uiObject = new GameObject(objectName, typeof(RectTransform));
        uiObject.transform.SetParent(parent, false);

        var rect = uiObject.GetComponent<RectTransform>();
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.pivot = new Vector2(0.5f, 0.5f);
        rect.anchoredPosition = anchoredPosition;
        rect.sizeDelta = size;
        return uiObject;
    }

    private static void StretchToParent(RectTransform rect)
    {
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.pivot = new Vector2(0.5f, 0.5f);
    }

    private static void SetLayerRecursively(GameObject root, int layer)
    {
        root.layer = layer;
        foreach (Transform child in root.transform)
        {
            SetLayerRecursively(child.gameObject, layer);
        }
    }

    private static void EnsurePrefabFolder()
    {
        if (!AssetDatabase.IsValidFolder("Assets/Prefabs"))
        {
            AssetDatabase.CreateFolder("Assets", "Prefabs");
        }

        if (!AssetDatabase.IsValidFolder(PrefabDirectory))
        {
            AssetDatabase.CreateFolder("Assets/Prefabs", "Clicker");
        }
    }
}
