---
phase: 05-ux-enhancement
plan: 02
title: UX 集成（UploadZone 增强 + 页面集成）
status: done
started: 2026-04-03T10:02:38Z
completed: 2026-04-03T10:12:00Z
commits:
  - d316c11  # Task 1: UploadZone enhancement
  - 9d7a15d  # Task 2: workspace UX integration
  - 696eaf4  # Task 3: data-hub UX integration
verification: npx tsc --noEmit → 0 errors
---

# Plan 02 Summary: UX 集成

## Completed Tasks

### Task 1: UploadZone 增强
- **File:** `frontend/app/components/UploadZone.tsx`
- Added simulated progress bar (0→90% gradual, 100% on complete)
- Added 50MB file size frontend validation with `onSizeError` callback
- Added upload states: idle → uploading → success → error with distinct visual feedback
- Disable drag/click during upload to prevent duplicate submissions
- Drag hover changes: icon switches to download arrow, text shows "松开以上传"
- `onUpload` prop now accepts `Promise<void>` return for completion tracking

### Task 2: workspace 页面 UX 集成
- **File:** `frontend/app/workspace/page.tsx` (surgical edits, no restructuring)
- Wrapped left/center/right columns with `<ErrorBoundary>` (3 boundaries)
- Added `SkeletonCard` for profile loading state in left panel
- Added `SkeletonTable` for query loading state in right panel
- Added progress bar animation during file upload in left panel
- Added Toast notifications at all async boundaries:
  - Upload success: `"数据集 {id} 导入成功"` (success)
  - Upload error: error message (error)
  - Query failure: detail message (error)
  - Network error: connection warning (error)
  - Playbook failure: detail message (error)

### Task 3: data-hub 页面 UX 集成
- **File:** `frontend/app/data-hub/page.tsx`
- Wrapped main content with `<ErrorBoundary>`
- Replaced spinner with `SkeletonCard` during profile loading
- Removed inline red error banner (`bg-red-50 border-red-200`)
- Replaced with Toast error notifications for consistent UX
- Added `onSizeError` prop wired to Toast for file size rejection
- Upload success/failure both use Toast (consistent with workspace)

## Verification
- `npx tsc --noEmit`: 0 errors across all files
- No import path issues, all components use correct relative paths
- ErrorBoundary (class component) correctly wraps functional children
- useToast hook called within ToastProvider context (verified via layout.tsx)

## Key Decisions
- workspace's inline upload zone kept as-is (not replaced with UploadZone component) to minimize refactoring scope
- `handleUpload` in data-hub re-throws errors so UploadZone can detect failure and show error state
- `show` added to workspace `handleUpload` useCallback dependency array to satisfy React exhaustive-deps
