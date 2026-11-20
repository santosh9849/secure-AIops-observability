from typing import List, Dict, Any

PLAYBOOKS = {
    "failed_auth_count": [
        {
            "action_id": "sec_block_source",
            "title": "Enforce temporary rate-limit & block offending source IP at local gateway",
            "type": "AUTONOMOUS_SAFE",
            "requires_human_approval": True,
            "risk_level": "LOW",
            "command_preview": "policy_engine.apply_rate_limit(target='auth-gateway', ttl='15m')",
        },
        {
            "action_id": "sec_rotate_tokens",
            "title": "Audit local authentication logs in Tier-1 vault for compromised accounts",
            "type": "MANUAL_INVESTIGATION",
            "requires_human_approval": False,
            "risk_level": "NONE",
            "command_preview": "local_vault.query(category='security', event='AUTH_FAILURE')",
        },
    ],
    "cpu_usage": [
        {
            "action_id": "infra_scale_workers",
            "title": "Throttle non-critical background workers or trigger horizontal replica scale-out",
            "type": "AUTONOMOUS_SAFE",
            "requires_human_approval": True,
            "risk_level": "LOW",
            "command_preview": "orchestrator.scale_deployment(service='worker-pool', delta=+2)",
        }
    ],
    "memory_usage": [
        {
            "action_id": "infra_recycle_pod",
            "title": "Perform rolling restart of memory-saturated service container",
            "type": "AUTONOMOUS_SAFE",
            "requires_human_approval": True,
            "risk_level": "MEDIUM",
            "command_preview": "orchestrator.rolling_restart(host=target_host)",
        }
    ],
    "packet_loss": [
        {
            "action_id": "net_reroute_traffic",
            "title": "Shift egress traffic to backup regional interface / secondary ISP link",
            "type": "AUTONOMOUS_SAFE",
            "requires_human_approval": True,
            "risk_level": "LOW",
            "command_preview": "sdwan.failover_path(host=target_host, preferred='secondary')",
        }
    ],
    "latency_ms": [
        {
            "action_id": "app_enable_cache",
            "title": "Enable read-replica routing and flush stale connection pools",
            "type": "AUTONOMOUS_SAFE",
            "requires_human_approval": True,
            "risk_level": "LOW",
            "command_preview": "db_proxy.enable_read_split(ratio=0.7)",
        }
    ],
}

DEFAULT_ACTION = [
    {
        "action_id": "ops_inspect_local",
        "title": "Inspect local Tier-1 telemetry snapshot via zero-trust RBAC session",
        "type": "MANUAL_INVESTIGATION",
        "requires_human_approval": False,
        "risk_level": "NONE",
        "command_preview": "tier1.open_diagnostic_tunnel(host=target_host)",
    }
]


class RecommendationEngine:
    def recommend(self, root_cause_metric: str, root_cause_host: str) -> List[Dict[str, Any]]:
        actions = PLAYBOOKS.get(root_cause_metric, DEFAULT_ACTION)
        enriched = []
        for act in actions:
            item = dict(act)
            item["target_host"] = root_cause_host
            item["command_preview"] = item["command_preview"].replace("target_host", f"'{root_cause_host}'")
            enriched.append(item)
        return enriched