"""AI 洞察服务：调用 OpenAI-compatible LLM，无 API Key 时返回 mock 洞察。"""

import json
import logging

from app.config import settings
from app.schemas import ABTestSpec, AIInsightRequest, AIInsightResponse

logger = logging.getLogger("chat-to-bi")


def generate_insight(req: AIInsightRequest) -> AIInsightResponse:
    """生成 AI 洞察。无 API Key 时返回规则生成的 mock 洞察。"""
    if not settings.llm_api_key:
        logger.info("[ai_service] LLM_API_KEY 未配置，使用 mock 洞察")
        return _mock_insight(req)
    try:
        return _call_llm(req)
    except Exception as exc:
        logger.warning("[ai_service] LLM 调用失败，降级为 mock: %s", exc)
        return _mock_insight(req)


def _mock_insight(req: AIInsightRequest) -> AIInsightResponse:
    """无 API Key 时返回基于规则的简单洞察（不阻断流程）。"""
    row_count = len(req.rows)
    col_count = len(req.rows[0]) if req.rows else 0
    return AIInsightResponse(
        insight=f"数据集包含 {row_count} 行、{col_count} 列。问题："{req.question}"。请配置 LLM_API_KEY 以获取真实 AI 分析。",
        suggestions=[
            "检查数据完整性，确认关键字段无缺失值",
            "对数值列进行描述性统计分析（均值、中位数、标准差）",
            "识别异常值并评估其对业务指标的影响",
        ],
        ab_test=ABTestSpec(
            goal="提升核心业务指标",
            metric="转化率 / GMV / 留存率（根据数据集选择）",
            design="随机分组：对照组保持现状，实验组应用优化方案",
            duration="建议 2-4 周，确保统计显著性",
        ),
    )


def _build_prompt(req: AIInsightRequest) -> str:
    """构建发送给 LLM 的 prompt。"""
    schema = [
        {"name": k, "type": type(v).__name__}
        for k, v in (req.rows[0].items() if req.rows else {}.items())
    ]
    sample = req.rows[:20]
    chart_info = req.chart.model_dump() if req.chart else {}
    manifest_info = req.manifest

    return f"""你是电商数据分析专家。

数据字段：{json.dumps(schema, ensure_ascii=False)}
样本数据（前20行）：{json.dumps(sample, ensure_ascii=False, default=str)}
图表结构：{json.dumps(chart_info, ensure_ascii=False)}
指标定义：{json.dumps(manifest_info, ensure_ascii=False)}
用户问题：{req.question}

请严格输出 JSON 格式（不要包含任何其他文字）：
{{
  "insight": "核心结论（1-2条，中文）",
  "suggestions": ["可执行建议1", "可执行建议2", "可执行建议3"],
  "ab_test": {{
    "goal": "测试目标",
    "metric": "核心指标",
    "design": "分组设计",
    "duration": "建议周期"
  }}
}}"""


def _call_llm(req: AIInsightRequest) -> AIInsightResponse:
    """调用 OpenAI-compatible API 获取 AI 洞察。"""
    from openai import OpenAI

    client = OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
    )

    prompt = _build_prompt(req)
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )

    content = response.choices[0].message.content or ""
    logger.info("[ai_service] LLM 响应长度: %d chars", len(content))

    # 去除可能的 markdown 代码块包裹
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    content = content.strip()

    data = json.loads(content)
    ab_test = None
    if "ab_test" in data and data["ab_test"]:
        ab_test = ABTestSpec(**data["ab_test"])

    return AIInsightResponse(
        insight=data.get("insight", ""),
        suggestions=data.get("suggestions", []),
        ab_test=ab_test,
    )
