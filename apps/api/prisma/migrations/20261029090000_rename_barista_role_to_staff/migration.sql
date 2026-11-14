-- Đổi vai trò BARISTA thành STAFF cho thống nhất với Assignment 1.
-- RENAME VALUE giữ nguyên dữ liệu: tài khoản đang là BARISTA tự thành STAFF.
ALTER TYPE "Role" RENAME VALUE 'BARISTA' TO 'STAFF';
