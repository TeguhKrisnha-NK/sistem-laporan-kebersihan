-- 1.  Tabel Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(50) NOT NULL UNIQUE,
    tingkat VARCHAR(20) NOT NULL CHECK (tingkat IN ('X', 'XI', 'XII')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabel Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth. users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Bersih', 'Kotor')),
    deskripsi TEXT,
    foto_url TEXT,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Insert contoh data
INSERT INTO classes (nama, tingkat) VALUES
('X A', 'X'),
('X B', 'X'),
('XI A', 'XI'),
('XI B', 'XI'),
('XII A', 'XII'),
('XII B', 'XII');