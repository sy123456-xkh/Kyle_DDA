"""查询端点集成测试 — POST /chat/query"""

import re
import pytest


class TestChatQueryCount:
    """包含行数/count 关键词时应返回 COUNT 查询"""

    def test_question_with_hanzi_count_keyword(self, test_client, uploaded_dataset):
        """问题包含 '行数' 时 sql 应包含 COUNT"""
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": uploaded_dataset, "question": "这个数据集有多少行数？"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "sql" in data
        assert "COUNT" in data["sql"].upper()

    def test_question_with_count_english(self, test_client, uploaded_dataset):
        """问题包含 'count' 时 sql 应包含 COUNT"""
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": uploaded_dataset, "question": "count rows please"},
        )
        assert resp.status_code == 200
        assert "COUNT" in resp.json()["sql"].upper()

    def test_count_response_has_rows_and_meta(self, test_client, uploaded_dataset):
        """COUNT 查询结果应包含 rows 与 meta 字段"""
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": uploaded_dataset, "question": "行数"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "rows" in data
        assert "meta" in data
        assert data["meta"]["row_count"] >= 0


class TestChatQuerySelectAll:
    """普通问题（无行数关键词）应返回 SELECT * LIMIT 查询"""

    def test_generic_question_returns_select_star(self, test_client, uploaded_dataset):
        """普通问题应生成 SELECT * 并带 LIMIT"""
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": uploaded_dataset, "question": "show me the data"},
        )
        assert resp.status_code == 200
        data = resp.json()
        sql_upper = data["sql"].upper()
        assert "SELECT" in sql_upper
        # 应有 LIMIT（规则生成 LIMIT 50，护栏不再追加）
        assert "LIMIT" in sql_upper

    def test_generic_question_returns_rows(self, test_client, uploaded_dataset):
        """普通问题应返回实际数据行（CSV 有 5 行）"""
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": uploaded_dataset, "question": "给我看看数据"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["rows"]) == 5  # 样本 CSV 有 5 行，LIMIT 50 不截断

    def test_response_contains_expected_columns(self, test_client, uploaded_dataset):
        """返回的 rows 应包含 CSV 中的列名"""
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": uploaded_dataset, "question": "show data"},
        )
        assert resp.status_code == 200
        rows = resp.json()["rows"]
        assert len(rows) > 0
        first_row = rows[0]
        assert "date" in first_row
        assert "product" in first_row
        assert "revenue" in first_row


class TestChatQueryInvalidDataset:
    """无效 dataset_id 应返回 4xx 错误"""

    def test_invalid_dataset_id_returns_error(self, test_client):
        """dataset_id 格式合法但数据集不存在时应返回错误（4xx 或 5xx）"""
        # ds_nonexist 格式合法（8位字母数字），但数据集不存在
        # 数据库会抛出 DuckDB 错误（视图不存在），返回 4xx 或 5xx
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": "ds_nonexist", "question": "any question"},
        )
        # 应该返回错误状态码（非 200）
        assert resp.status_code != 200

    def test_malformed_dataset_id_returns_4xx(self, test_client):
        """格式不合法的 dataset_id 应返回 4xx"""
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": "invalid-id!!!", "question": "test"},
        )
        assert resp.status_code in (400, 404)

    def test_empty_dataset_id_returns_4xx(self, test_client):
        """空 dataset_id 应返回 4xx"""
        resp = test_client.post(
            "/chat/query",
            json={"dataset_id": "", "question": "test"},
        )
        assert resp.status_code in (400, 404, 422)
