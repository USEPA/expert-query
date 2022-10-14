package main

import (
    "bufio"
	"context"
	"database/sql"
	"fmt"
    "io"
	"log"
    "math/rand"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

const hucsFile = "hucs.txt"

func main() {
    log.SetFlags(log.LstdFlags | log.Lshortfile)

    err := godotenv.Load(".env.local")
    if err != nil {
        log.Fatal(err)
    }

    host, hostExists := os.LookupEnv("PGHOST")
    user, userExists := os.LookupEnv("PGUSER")
    password, passwordExists := os.LookupEnv("PGPASSWORD")
    dbName, dbNameExists := os.LookupEnv("PGDATABASE")
    if !hostExists || !userExists || !passwordExists || !dbNameExists {
        log.Fatal("Please provide a database configuration")
    }
    dbPort, dbPortExists := os.LookupEnv("PGPORT")
    if !dbPortExists {
        dbPort = "5432"
    }

    conn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, dbPort, user, password, dbName)
    db, err := sql.Open("postgres", conn)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    db.SetConnMaxLifetime(0)
    db.SetConnMaxIdleTime(50)
    db.SetMaxOpenConns(50)

    if err = db.Ping(); err != nil {
        err = pingLoop(db, 30 * time.Second)
    }
    if err != nil {
        log.Fatal(err)
    }

    hucs, err := readLines(hucsFile)
    if err != nil {
        log.Fatal(err)
    }

    s := &Service{
        db: db,
        hucs: hucs,
    }

    httpPort, httpPortExists := os.LookupEnv("PORT")
    if !httpPortExists {
        httpPort = "8080"
    }
    fmt.Printf("Server listening on port %s\n", httpPort)
    http.ListenAndServe(":" + httpPort, s)

}

type Service struct {
    db *sql.DB
    hucs []string
}

func (s *Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    db := s.db
    hucs := s.hucs

	switch r.URL.Path {
	default:
		http.Error(w, "not found", http.StatusNotFound)
		return
	case "/":
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()

        selectColumn := "assessmentunitidentifier"
		table := "assessments_by_catchment"
        whereColumn := "huc12"

        randomIndex := rand.Intn(len(hucs))
        huc := hucs[randomIndex]
        querystring := fmt.Sprintf("SELECT %s FROM %s WHERE %s = '%s';",
            selectColumn, table, whereColumn, huc,
        )
		rows, err := db.QueryContext(ctx, querystring)
		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
        defer rows.Close()

        var ids []string
        for rows.Next() {
            var id string
            err = rows.Scan(&id)
            if err != nil {
                break
            }
            ids = append(ids, id)
        }

		// Check for errors during rows "Close".
		if closeErr := rows.Close(); closeErr != nil {
			http.Error(w, closeErr.Error(), http.StatusInternalServerError)
			return
		}

		// Check for row scan error.
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Check for errors during row iteration.
		if err = rows.Err(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

        countstring := fmt.Sprintf("Count: %d", len(ids))
        io.WriteString(w, countstring)
		return
    }
}

func readLines(path string) ([]string, error) {
    file, err := os.Open(path)
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    var lines []string
    scanner := bufio.NewScanner(file)
    for scanner.Scan() {
        lines = append(lines, scanner.Text())
    }
    return lines, scanner.Err()
}

func pingLoop(db *sql.DB, timeout time.Duration) (error) {
    ticker := time.NewTicker(5 * time.Second)
    defer ticker.Stop()

    timeoutExceeded := time.After(timeout)
    for {
        select {
        case <-timeoutExceeded:
            return fmt.Errorf("Timeout exceeded")
        case <-ticker.C:
            err := db.Ping()
            if err == nil {
                return nil
            }
            fmt.Println("No response, retrying")
        }
    }
}
