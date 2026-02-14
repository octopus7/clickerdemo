using UnityEditor;
using UnityEditor.SceneManagement;

public static class ClickerAgentBatchMenu
{
    private const string ClickerScenePath = "Assets/Scenes/ClickerScene.unity";

    [MenuItem("Tools/에이전트 작업 실행", false, 0)]
    public static void RunAgentBatch()
    {
        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo())
        {
            return;
        }

        var prefabCreated = UpgradePanelPrefabBuilder.CreateUpgradePanelPrefab(false);
        var sceneCreated = ClickerSceneBuilder.CreateFreshClickerScene(false, false);

        if (sceneCreated)
        {
            EditorGUIUtility.PingObject(AssetDatabase.LoadAssetAtPath<SceneAsset>(ClickerScenePath));
        }

        var summary = $"Upgrade Prefab: {(prefabCreated ? "OK" : "Failed")}\nClicker Scene: {(sceneCreated ? "OK" : "Failed")}";
        EditorUtility.DisplayDialog("에이전트 작업 실행", summary, "OK");
    }
}
