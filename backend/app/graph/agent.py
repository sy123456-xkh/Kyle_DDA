"""
LangGraph Agent 预留骨架。
当前直接调用 query_service + ai_service。
未来替换为 LangGraph 工作流（M2 阶段）。
不引入 langgraph 依赖。
"""


def run_agent(state: dict) -> dict:
    """
    预留接口：未来替换为 LangGraph 工作流。
    当前直接调用服务层。

    Args:
        state: {
            "dataset_id": str,
            "question": str,
            "rows": list,
            "chart": dict | None,
            "manifest": dict
        }
    Returns:
        {"insight": str, "suggestions": list, "ab_test": dict | None}
    """
    from app.schemas import AIInsightRequest
    from app.services.ai_service import generate_insight

    req = AIInsightRequest(
        dataset_id=state.get("dataset_id", ""),
        question=state.get("question", ""),
        rows=state.get("rows", []),
        manifest=state.get("manifest", {}),
    )
    result = generate_insight(req)
    return result.model_dump()
