-- csv insert format:
-- "id","title","tagline","overview","original_language","poster","runtime","vote_average","vote_count","budget","revenue","homepage","release_date"
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    tagline VARCHAR(500),
    overview TEXT,
    original_language VARCHAR(12),
    poster VARCHAR(500),
    runtime INTEGER,
    vote_average DECIMAL(4,2) NOT NULL DEFAULT 0,
    vote_count INTEGER NOT NULL DEFAULT 0,
    budget INTEGER,
    revenue BIGINT,
    homepage VARCHAR(500),
    release_date DATE,
    PRIMARY KEY(id)
);

-- csv insert format:
-- "id","name"
CREATE TABLE IF NOT EXISTS  genres (
    id INTEGER NOT NULL,
    name VARCHAR(32) NOT NULL,
    PRIMARY KEY(id)
);

-- csv insert format:
-- "id","name"
CREATE TABLE IF NOT EXISTS production_companies (
    id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY(id)
);


-- Relations

-- many to many relationship: movies <--> genres
-- csv insert format:
-- "movie_id","genre_id"
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER NOT NULL,
    genre_id INTEGER NOT NULL,

    PRIMARY KEY (movie_id, genre_id),
    Foreign Key (movie_id) REFERENCES movies(id),
    Foreign Key (genre_id) REFERENCES genres(id)
);

-- many to many relationship: movies <--> production_companies
-- csv insert format:
-- "movie_id","company_id"

CREATE TABLE IF NOT EXISTS movie_companies  (
    movie_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,

    PRIMARY KEY (movie_id, company_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (company_id) REFERENCES production_companies(id)
);

-- Indexes for relations

-- quick movie lookup based on genre instead of movie_id
CREATE INDEX idx_movie_genres_genre_id ON movie_genres(genre_id);
-- quick movie lookup based on company instead of movie_id
CREATE INDEX idx_movie_companies_company_id ON movie_companies(company_id);

-- User specific tables

-- username, email, password, api_key, api_date(DATETIME to show key changes on the same day)
CREATE TABLE IF NOT EXISTS amuvie_users (
    id INTEGER NOT NULL AUTO_INCREMENT,
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) UNIQUE,
    api_date DATETIME,

    PRIMARY KEY(id)
);

-- links a movieID and userID, plus includes a priority value between 1-10 (where 1 is high) and a notes field.
CREATE TABLE IF NOT EXISTS amuvie_to_watch_list (
    id INTEGER NOT NULL AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    priority INTEGER NOT NULL DEFAULT 5,
    notes TEXT,
    PRIMARY KEY(id),
    -- Composite key must be unique
    UNIQUE (user_id, movie_id),
    CONSTRAINT check_priority CHECK (priority BETWEEN 1 and 10),
    FOREIGN KEY(user_id) REFERENCES amuvie_users(id),
    FOREIGN KEY(movie_id) REFERENCES movies(id)
);


-- links a movieID and userID, plus includes a rating, a notes field, a date initially watched, and date last watched and a number of times watched
CREATE TABLE IF NOT EXISTS amuvie_completed_watch_list (
    id INTEGER NOT NULL AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    movie_id INTEGER NOT NULL,
    rating DECIMAL(3,1),
    notes TEXT,
    date_first_watched DATE,
    date_last_watched DATE,
    times_watched INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY(id),
    -- Composite key must be unique
    UNIQUE (user_id, movie_id),
    FOREIGN KEY(user_id) REFERENCES amuvie_users(id),
    FOREIGN KEY(movie_id) REFERENCES movies(id)
);

-- indexes
CREATE INDEX idx_towatch_movie_id ON amuvie_to_watch_list(movie_id);
CREATE INDEX idx_completed_movie_id ON amuvie_completed_watch_list(movie_id);


