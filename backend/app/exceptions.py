"""自定义异常类"""

from typing import Optional


class DatasetNotFoundError(Exception):
    """数据集不存在"""

    def __init__(self, message: str, detail: Optional[str] = None):
        self.message = message
        self.detail = detail
        super().__init__(message)


class SQLGuardrailError(Exception):
    """SQL 护栏拦截"""

    def __init__(self, message: str, detail: Optional[str] = None):
        self.message = message
        self.detail = detail
        super().__init__(message)


class FileValidationError(Exception):
    """文件验证失败"""

    def __init__(self, message: str, detail: Optional[str] = None):
        self.message = message
        self.detail = detail
        super().__init__(message)
