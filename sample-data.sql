-- Run this AFTER starting the Spring Boot app (so tables are created by Hibernate)
-- Connect to MySQL and run:

USE GrantTrack;

INSERT INTO faculty (name, email, department) VALUES
('Dr. Arun Kumar',   'arun@example.com',   'Computer Science'),
('Dr. Priya Sharma', 'priya@example.com',  'Biotechnology'),
('Dr. Ravi Menon',   'ravi@example.com',   'Mechanical Engineering');
