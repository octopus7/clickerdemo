using UnityEditor;
using UnityEditor.Callbacks;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class ClickerAgentBatchMenu
{
    private const string MenuPath = "Tools/\uC5D0\uC774\uC804\uD2B8 \uC791\uC5C5 \uC2E4\uD589";
    private const string BatchScriptTimestamp = "2026-02-15T02:20:00Z";
    private const string LastAppliedTimestampKey = "clicker.agent_batch.last_applied_timestamp";
    private const string HighlightColorHex = "#FF8C00";

    [MenuItem(MenuPath, false, 0)]
    public static void RunAgentBatchMenu()
    {
        TryRunBatch(isAutoRun: false, forceRun: true);
    }

    [DidReloadScripts]
    private static void RunOnScriptsReloaded()
    {
        EditorApplication.delayCall += () =>
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
            {
                return;
            }

            TryRunBatch(isAutoRun: true, forceRun: false);
        };
    }

    private static void TryRunBatch(bool isAutoRun, bool forceRun)
    {
        if (!forceRun && IsAlreadyApplied())
        {
            LogInfo($"Skip: already applied batch version {BatchScriptTimestamp}.");
            return;
        }

        if (HasDirtyScene())
        {
            LogWarning("Skip: dirty scene detected. Save current scene and run the batch again.");
            return;
        }

        var prefabCreated = UpgradePanelPrefabBuilder.CreateUpgradePanelPrefab(false);
        var sceneCreated = ClickerSceneBuilder.CreateFreshClickerScene(false, false);
        var completed = prefabCreated && sceneCreated;

        if (!completed)
        {
            LogError(
                $"Batch failed. UpgradePrefab={(prefabCreated ? "OK" : "Failed")}, " +
                $"ClickerScene={(sceneCreated ? "OK" : "Failed")}.");
            return;
        }

        EditorPrefs.SetString(LastAppliedTimestampKey, BatchScriptTimestamp);
        var runType = isAutoRun ? "AutoRun" : "ManualRun";
        LogInfo($"{runType} completed. Version={BatchScriptTimestamp}");
    }

    private static bool IsAlreadyApplied()
    {
        return EditorPrefs.GetString(LastAppliedTimestampKey, string.Empty) == BatchScriptTimestamp;
    }

    private static bool HasDirtyScene()
    {
        var loadedSceneCount = SceneManager.sceneCount;
        for (var index = 0; index < loadedSceneCount; index++)
        {
            if (SceneManager.GetSceneAt(index).isDirty)
            {
                return true;
            }
        }

        return false;
    }

    private static void LogInfo(string message)
    {
        Debug.Log(GetPrefix() + " " + message);
    }

    private static void LogWarning(string message)
    {
        Debug.LogWarning(GetPrefix() + " " + message);
    }

    private static void LogError(string message)
    {
        Debug.LogError(GetPrefix() + " " + message);
    }

    private static string GetPrefix()
    {
        return $"<color={HighlightColorHex}><b>[AgentBatch]</b></color>";
    }
}
