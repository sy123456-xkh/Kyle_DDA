"""SQL 护栏单元测试 — 直接测试 _guard_sql 函数"""

import pytest

from app.exceptions import SQLGuardrailError
from app.services.query_service import _guard_sql


class TestGuardSqlValidSelect:
    """有效 SELECT 语句应直接通过（可能追加 LIMIT）"""

    def test_plain_select_passes(self):
        """简单 SELECT 语句不应被拒绝"""
        sql = "SELECT * FROM v_dataset_ds_abc12345"
        result = _guard_sql(sql)
        # 应该通过（会追加 LIMIT 5000）
        assert "SELECT" in result.upper()

    def test_select_with_where_passes(self):
        """带 WHERE 子句的 SELECT 不应被拒绝"""
        sql = "SELECT name, revenue FROM v_dataset_ds_abc12345 WHERE revenue > 100"
        result = _guard_sql(sql)
        assert result  # 不应抛异常


class TestGuardSqlForbiddenKeywords:
    """INSERT / UPDATE / DROP / ALTER / DELETE 应被 SQLGuardrailError 拦截"""

    def test_insert_raises(self):
        """INSERT 语句应被拒绝"""
        with pytest.raises(SQLGuardrailError):
            _guard_sql("INSERT INTO foo VALUES (1)")

    def test_update_raises(self):
        """UPDATE 语句应被拒绝"""
        with pytest.raises(SQLGuardrailError):
            _guard_sql("UPDATE foo SET bar=1")

    def test_delete_raises(self):
        """DELETE 语句应被拒绝"""
        with pytest.raises(SQLGuardrailError):
            _guard_sql("DELETE FROM foo")

    def test_drop_raises(self):
        """DROP 语句应被拒绝"""
        with pytest.raises(SQLGuardrailError):
            _guard_sql("DROP TABLE foo")

    def test_alter_raises(self):
        """ALTER 语句应被拒绝"""
        with pytest.raises(SQLGuardrailError):
            _guard_sql("ALTER TABLE foo ADD COLUMN bar INT")

    def test_create_raises(self):
        """CREATE 语句应被拒绝"""
        with pytest.raises(SQLGuardrailError):
            _guard_sql("CREATE TABLE new_table AS SELECT 1")

    def test_truncate_raises(self):
        """TRUNCATE 语句应被拒绝"""
        with pytest.raises(SQLGuardrailError):
            _guard_sql("TRUNCATE TABLE foo")


class TestGuardSqlLimitBehavior:
    """LIMIT 自动补全逻辑"""

    def test_no_limit_auto_adds_limit_5000(self):
        """没有 LIMIT 时应自动追加 LIMIT 5000"""
        sql = "SELECT * FROM v_dataset_ds_abc12345"
        result = _guard_sql(sql)
        assert "LIMIT 5000" in result.upper()

    def test_existing_limit_not_changed(self):
        """已有 LIMIT 时不应再次追加"""
        sql = "SELECT * FROM v_dataset_ds_abc12345 LIMIT 100"
        result = _guard_sql(sql)
        # 结果中应只有一个 LIMIT
        assert result.upper().count("LIMIT") == 1
        # 原有 LIMIT 100 不应被替换
        assert "LIMIT 100" in result.upper()
        assert "LIMIT 5000" not in result.upper()

    def test_select_with_semicolon_strips_and_adds_limit(self):
        """末尾有分号时应先去掉分号再补 LIMIT"""
        sql = "SELECT * FROM v_dataset_ds_abc12345;"
        result = _guard_sql(sql)
        assert "LIMIT 5000" in result.upper()
        # 分号不应出现在 LIMIT 之前
        assert result.rstrip().endswith(str(5000))


class TestGuardSqlLength:
    """超长 SQL 应被拒绝"""

    def test_sql_exceeding_max_length_raises(self):
        """超过 5000 字符的 SQL 应被 SQLGuardrailError 拒绝"""
        long_sql = "SELECT " + "a" * 5001
        with pytest.raises(SQLGuardrailError):
            _guard_sql(long_sql)

    def test_sql_at_exact_max_length_raises(self):
        """恰好 5001 字符的 SQL 应被拒绝"""
        long_sql = "SELECT " + "x" * (5001 - len("SELECT "))
        assert len(long_sql) == 5001
        with pytest.raises(SQLGuardrailError):
            _guard_sql(long_sql)

    def test_sql_under_max_length_passes(self):
        """5000 字符以内的 SQL 不应因长度被拒绝"""
        normal_sql = "SELECT * FROM v_dataset_ds_abc12345"
        result = _guard_sql(normal_sql)
        assert result  # 不应因长度抛异常
