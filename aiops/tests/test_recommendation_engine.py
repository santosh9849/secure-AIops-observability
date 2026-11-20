
from recommendations.recommendation_engine import RecommendationEngine


def test_cpu_recommendation():
    engine = RecommendationEngine()
    result = engine.recommend("cpu_usage", "SERVER_01")

    assert len(result) == 1
    assert result[0]["action_id"] == "infra_scale_workers"
    assert result[0]["target_host"] == "SERVER_01"


def test_security_recommendation():
    engine = RecommendationEngine()
    result = engine.recommend("failed_auth_count", "SERVER_02")

    assert len(result) == 2
    assert result[0]["action_id"] == "sec_block_source"


def test_unknown_metric_uses_default():
    engine = RecommendationEngine()
    result = engine.recommend("unknown_metric", "SERVER_03")

    assert result[0]["action_id"] == "ops_inspect_local"
    assert result[0]["target_host"] == "SERVER_03"


def test_command_preview_contains_host():
    engine = RecommendationEngine()
    result = engine.recommend("memory_usage", "SERVER_04")

    assert "'SERVER_04'" in result[0]["command_preview"]


def test_human_approval_is_required_for_safe_actions():
    engine = RecommendationEngine()
    result = engine.recommend("cpu_usage", "SERVER_01")

    assert result[0]["type"] == "AUTONOMOUS_SAFE"
    assert result[0]["requires_human_approval"] is True
