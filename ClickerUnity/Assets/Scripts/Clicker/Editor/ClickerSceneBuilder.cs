using System;
using System.Reflection;
using ClickerUnity;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public static class ClickerSceneBuilder
{
    private const string SceneFolderPath = "Assets/Scenes";
    private const string SceneAssetFolderName = "Scenes";
    private const string ScenePath = "Assets/Scenes/ClickerScene.unity";
    private const string BuiltinFontPath = "LegacyRuntime.ttf";

    [MenuItem("Tools/Create Clicker Scene (Fresh)")]
    public static void CreateFreshClickerScene()
    {
        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
        {
            return;
        }

        EnsureSceneFolder();
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

        CreateMainCamera();
        CreateEventSystem();
        var canvas = CreateCanvas();

        var currencyText = CreateCurrencyText(canvas.transform);
        var clickButton = CreateClickButton(canvas.transform);

        var managerObject = new GameObject("GameManager");
        var clickerGame = managerObject.AddComponent<ClickerGame>();

        var serializedClicker = new SerializedObject(clickerGame);
        serializedClicker.FindProperty("currencyText").objectReferenceValue = currencyText;
        serializedClicker.FindProperty("clickButton").objectReferenceValue = clickButton;
        serializedClicker.FindProperty("startingCurrency").intValue = 0;
        serializedClicker.FindProperty("clickValue").intValue = 1;
        serializedClicker.ApplyModifiedPropertiesWithoutUndo();

        EditorSceneManager.MarkSceneDirty(scene);

        var sceneSaved = EditorSceneManager.SaveScene(scene, ScenePath, false);
        AssetDatabase.Refresh();

        if (!sceneSaved)
        {
            EditorUtility.DisplayDialog("Clicker Scene", $"Scene save failed: {ScenePath}", "OK");
            return;
        }

        EditorGUIUtility.PingObject(AssetDatabase.LoadAssetAtPath<SceneAsset>(ScenePath));
        EditorUtility.DisplayDialog("Clicker Scene", $"Fresh scene created: {ScenePath}", "OK");
    }

    [MenuItem("Tools/Modify Clicker Scene (Partial)")]
    public static void ModifyClickerScenePartial()
    {
        EditorUtility.DisplayDialog(
            "Clicker Scene",
            "Partial modify menu is ready. Implementation will be added next.",
            "OK");
    }

    private static void CreateMainCamera()
    {
        var cameraObject = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener));
        cameraObject.tag = "MainCamera";
        cameraObject.transform.position = new Vector3(0f, 0f, -10f);

        var camera = cameraObject.GetComponent<Camera>();
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color(0.09f, 0.12f, 0.16f, 1f);
    }

    private static void CreateEventSystem()
    {
        var eventSystemObject = new GameObject("EventSystem", typeof(EventSystem));

        // Input System package is present in newer projects, otherwise fallback to old input module.
        var inputSystemUiModuleType = Type.GetType("UnityEngine.InputSystem.UI.InputSystemUIInputModule, Unity.InputSystem");
        if (inputSystemUiModuleType != null)
        {
            var inputModule = eventSystemObject.AddComponent(inputSystemUiModuleType);
            var assignDefaultActionsMethod = inputSystemUiModuleType.GetMethod(
                "AssignDefaultActions",
                BindingFlags.Public | BindingFlags.Instance);
            assignDefaultActionsMethod?.Invoke(inputModule, null);
            return;
        }

        eventSystemObject.AddComponent<StandaloneInputModule>();
    }

    private static Canvas CreateCanvas()
    {
        var canvasObject = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        var canvas = canvasObject.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;

        var scaler = canvasObject.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
        scaler.matchWidthOrHeight = 0.5f;

        return canvas;
    }

    private static Text CreateCurrencyText(Transform parent)
    {
        var textObject = CreateCenteredUiObject("CurrencyText", parent, new Vector2(0f, 200f), new Vector2(600f, 120f));
        var text = textObject.AddComponent<Text>();
        text.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        text.fontSize = 64;
        text.alignment = TextAnchor.MiddleCenter;
        text.color = Color.white;
        text.text = "Gold: 0";

        return text;
    }

    private static Button CreateClickButton(Transform parent)
    {
        var buttonObject = CreateCenteredUiObject("ClickButton", parent, new Vector2(0f, -20f), new Vector2(420f, 170f));
        var buttonImage = buttonObject.AddComponent<Image>();
        buttonImage.color = new Color(0.2f, 0.67f, 0.35f, 1f);

        var button = buttonObject.AddComponent<Button>();
        button.targetGraphic = buttonImage;
        var buttonColors = button.colors;
        buttonColors.highlightedColor = new Color(0.25f, 0.74f, 0.41f, 1f);
        buttonColors.pressedColor = new Color(0.15f, 0.54f, 0.28f, 1f);
        button.colors = buttonColors;

        var labelObject = new GameObject("Label", typeof(RectTransform));
        labelObject.transform.SetParent(buttonObject.transform, false);

        var labelRect = labelObject.GetComponent<RectTransform>();
        labelRect.anchorMin = Vector2.zero;
        labelRect.anchorMax = Vector2.one;
        labelRect.offsetMin = Vector2.zero;
        labelRect.offsetMax = Vector2.zero;

        var labelText = labelObject.AddComponent<Text>();
        labelText.font = Resources.GetBuiltinResource<Font>(BuiltinFontPath);
        labelText.fontSize = 52;
        labelText.alignment = TextAnchor.MiddleCenter;
        labelText.color = Color.white;
        labelText.text = "+1 Gold";

        return button;
    }

    private static GameObject CreateCenteredUiObject(string objectName, Transform parent, Vector2 anchoredPosition, Vector2 size)
    {
        var uiObject = new GameObject(objectName, typeof(RectTransform));
        uiObject.transform.SetParent(parent, false);

        var rect = uiObject.GetComponent<RectTransform>();
        rect.anchorMin = new Vector2(0.5f, 0.5f);
        rect.anchorMax = new Vector2(0.5f, 0.5f);
        rect.pivot = new Vector2(0.5f, 0.5f);
        rect.anchoredPosition = anchoredPosition;
        rect.sizeDelta = size;

        return uiObject;
    }

    private static void EnsureSceneFolder()
    {
        if (!AssetDatabase.IsValidFolder(SceneFolderPath))
        {
            AssetDatabase.CreateFolder("Assets", SceneAssetFolderName);
            AssetDatabase.Refresh();
        }
    }
}
