"""上传与 Profiling 端点集成测试"""

import re
import pytest


# ---------------------------------------------------------------------------
# POST /datasets/upload
# ---------------------------------------------------------------------------
class TestUploadCSV:
    """CSV 上传端点测试"""

    def test_valid_csv_returns_200_with_dataset_id(self, test_client, sample_csv_bytes):
        """上传合法 CSV 应返回 200 及 dataset_id"""
        resp = test_client.post(
            "/datasets/upload",
            files={"file": ("data.csv", sample_csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "dataset_id" in data

    def test_dataset_id_format_is_alphanumeric_underscore(
        self, test_client, sample_csv_bytes
    ):
        """返回的 dataset_id 应仅包含字母、数字和下划线"""
        resp = test_client.post(
            "/datasets/upload",
            files={"file": ("data.csv", sample_csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        dataset_id = resp.json()["dataset_id"]
        # 仅允许字母数字下划线
        assert re.match(r"^[a-zA-Z0-9_]+$", dataset_id), (
            f"dataset_id 格式不合法: {dataset_id}"
        )

    def test_dataset_id_starts_with_ds_prefix(self, test_client, sample_csv_bytes):
        """dataset_id 应以 'ds_' 开头"""
        resp = test_client.post(
            "/datasets/upload",
            files={"file": ("data.csv", sample_csv_bytes, "text/csv")},
        )
        assert resp.status_code == 200
        dataset_id = resp.json()["dataset_id"]
        assert dataset_id.startswith("ds_"), f"dataset_id 不以 ds_ 开头: {dataset_id}"

    def test_non_csv_extension_returns_400(self, test_client):
        """上传非 CSV 扩展名的文件应返回 400"""
        txt_content = b"col1,col2\n1,2\n3,4\n"
        resp = test_client.post(
            "/datasets/upload",
            files={"file": ("data.txt", txt_content, "text/plain")},
        )
        assert resp.status_code == 400

    def test_csv_with_wrong_content_type_but_csv_extension_allowed(
        self, test_client, sample_csv_bytes
    ):
        """CSV 扩展名即使 content-type 不同也应被接受（只检查扩展名）"""
        resp = test_client.post(
            "/datasets/upload",
            files={"file": ("data.csv", sample_csv_bytes, "application/octet-stream")},
        )
        # 只要文件名以 .csv 结尾就应该通过（main.py 只检查扩展名）
        assert resp.status_code == 200

    def test_empty_csv_returns_400(self, test_client):
        """上传空 CSV 文件应返回 400"""
        resp = test_client.post(
            "/datasets/upload",
            files={"file": ("empty.csv", b"", "text/csv")},
        )
        assert resp.status_code == 400

    def test_csv_with_only_header_no_rows_is_handled(self, test_client):
        """只有表头没有数据行的 CSV 应被正常处理（不崩溃）"""
        header_only = b"col_a,col_b,col_c\n"
        resp = test_client.post(
            "/datasets/upload",
            files={"file": ("header_only.csv", header_only, "text/csv")},
        )
        # 有表头无数据行应成功上传（row_count=0）
        assert resp.status_code == 200

    def test_multiple_uploads_return_different_ids(
        self, test_client, sample_csv_bytes
    ):
        """多次上传应返回不同的 dataset_id"""
        resp1 = test_client.post(
            "/datasets/upload",
            files={"file": ("data1.csv", sample_csv_bytes, "text/csv")},
        )
        resp2 = test_client.post(
            "/datasets/upload",
            files={"file": ("data2.csv", sample_csv_bytes, "text/csv")},
        )
        assert resp1.status_code == 200
        assert resp2.status_code == 200
        assert resp1.json()["dataset_id"] != resp2.json()["dataset_id"]


# ---------------------------------------------------------------------------
# GET /datasets/{id}/profile
# ---------------------------------------------------------------------------
class TestGetProfile:
    """Profiling 端点测试"""

    def test_valid_dataset_returns_200(self, test_client, uploaded_dataset):
        """有效 dataset_id 应返回 200"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        assert resp.status_code == 200

    def test_profile_has_row_count_equals_5(self, test_client, uploaded_dataset):
        """样本 CSV 有 5 行，row_count 应为 5"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        assert resp.status_code == 200
        assert resp.json()["row_count"] == 5

    def test_profile_has_columns_list(self, test_client, uploaded_dataset):
        """profile 响应应包含 columns 列表"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        data = resp.json()
        assert "columns" in data
        assert isinstance(data["columns"], list)
        assert len(data["columns"]) > 0

    def test_profile_columns_contain_expected_names(
        self, test_client, uploaded_dataset
    ):
        """columns 应包含 CSV 中的三列：date, product, revenue"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        col_names = [c["name"] for c in resp.json()["columns"]]
        assert "date" in col_names
        assert "product" in col_names
        assert "revenue" in col_names

    def test_profile_columns_have_name_and_type(self, test_client, uploaded_dataset):
        """每个 column 应有 name 和 type 字段"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        for col in resp.json()["columns"]:
            assert "name" in col
            assert "type" in col
            assert col["name"]  # name 不为空
            assert col["type"]  # type 不为空

    def test_profile_has_missing_rate(self, test_client, uploaded_dataset):
        """profile 应包含 missing_rate 列表"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        data = resp.json()
        assert "missing_rate" in data
        assert isinstance(data["missing_rate"], list)
        assert len(data["missing_rate"]) > 0

    def test_missing_rate_values_between_0_and_1(self, test_client, uploaded_dataset):
        """所有列的 missing_rate 应在 0~1 之间"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        for item in resp.json()["missing_rate"]:
            assert 0.0 <= item["missing_rate"] <= 1.0, (
                f"missing_rate 超出范围: {item}"
            )

    def test_sample_csv_has_no_missing_values(self, test_client, uploaded_dataset):
        """样本 CSV 无缺失值，missing_rate 应全为 0"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        for item in resp.json()["missing_rate"]:
            assert item["missing_rate"] == 0.0, (
                f"预期无缺失值但得到: {item}"
            )

    def test_profile_has_sample_values(self, test_client, uploaded_dataset):
        """profile 应包含 sample_values 列表"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        data = resp.json()
        assert "sample_values" in data
        assert isinstance(data["sample_values"], list)
        assert len(data["sample_values"]) > 0

    def test_sample_values_have_name_and_values(self, test_client, uploaded_dataset):
        """每个 sample_values 条目应有 name 和 values 字段"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        for item in resp.json()["sample_values"]:
            assert "name" in item
            assert "values" in item
            assert isinstance(item["values"], list)

    def test_sample_values_at_most_5_per_column(self, test_client, uploaded_dataset):
        """每列的样例值不超过 5 个"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        for item in resp.json()["sample_values"]:
            assert len(item["values"]) <= 5, (
                f"样例值超过 5 个: {item['name']} = {item['values']}"
            )

    def test_fake_dataset_id_returns_error(self, test_client):
        """不存在的 dataset_id（格式合法）应返回错误（4xx 或 5xx）"""
        # ds_fakeid00 格式合法，但数据集不存在；DuckDB 查询不存在的视图会返回错误
        resp = test_client.get("/datasets/ds_fakeid00/profile")
        assert resp.status_code != 200

    def test_invalid_format_dataset_id_returns_4xx(self, test_client):
        """格式不合法的 dataset_id 应返回 4xx"""
        resp = test_client.get("/datasets/not-valid!/profile")
        assert resp.status_code in (400, 404)

    def test_profile_missing_rate_has_name_field(self, test_client, uploaded_dataset):
        """missing_rate 每条应包含 name 字段"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        for item in resp.json()["missing_rate"]:
            assert "name" in item
            assert item["name"]  # name 不为空


# ---------------------------------------------------------------------------
# Profile 内容深度验证
# ---------------------------------------------------------------------------
class TestProfileContent:
    """Profile 响应内容的深度验证"""

    def test_revenue_column_is_numeric_type(self, test_client, uploaded_dataset):
        """revenue 列（整数值）应被推断为数值类型"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        cols = {c["name"]: c["type"] for c in resp.json()["columns"]}
        assert "revenue" in cols
        # DuckDB 会推断为 BIGINT/INTEGER/DOUBLE 等数值类型
        assert any(
            t in cols["revenue"].upper()
            for t in ("INT", "BIGINT", "DOUBLE", "FLOAT", "DECIMAL", "NUMERIC")
        ), f"revenue 类型非数值: {cols['revenue']}"

    def test_product_column_has_sample_values(self, test_client, uploaded_dataset):
        """product 列应有样例值（Apple, Banana 等）"""
        resp = test_client.get(f"/datasets/{uploaded_dataset}/profile")
        samples = {
            item["name"]: item["values"]
            for item in resp.json()["sample_values"]
        }
        assert "product" in samples
        assert len(samples["product"]) > 0

    def test_csv_with_missing_values_shows_nonzero_missing_rate(self, test_client):
        """含缺失值的 CSV 应显示非零 missing_rate"""
        csv_with_nulls = (
            b"name,score\n"
            b"Alice,90\n"
            b"Bob,\n"
            b"Carol,85\n"
            b"Dave,\n"
            b"Eve,95\n"
        )
        # 上传含缺失值的 CSV
        upload_resp = test_client.post(
            "/datasets/upload",
            files={"file": ("nulls.csv", csv_with_nulls, "text/csv")},
        )
        assert upload_resp.status_code == 200
        ds_id = upload_resp.json()["dataset_id"]

        # 获取 profile
        profile_resp = test_client.get(f"/datasets/{ds_id}/profile")
        assert profile_resp.status_code == 200
        missing = {
            item["name"]: item["missing_rate"]
            for item in profile_resp.json()["missing_rate"]
        }
        # score 列有 2 个缺失值 / 5 行 = 0.4
        assert missing["score"] > 0.0, f"score 缺失率应 > 0，实际: {missing['score']}"
