package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
)

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)
	http.HandleFunc("/callback", callbackHandler)

	log.Println("Listening...")
	http.ListenAndServe(":3000", nil)
}

func callbackHandler(w http.ResponseWriter, r *http.Request) {
	// b, _ := ioutil.ReadAll(r.Body)
	// fmt.Fprintf(w, string(b))

	r.ParseForm()

	// // DEBUG:
	// debugB, _ := json.MarshalIndent(r.PostForm, "", "\t")
	// fmt.Println("\x1b[32;1mCALLBACK POSTFORM DATA:\x1b[0m", string(debugB))

	var params []string
	for k, v := range r.PostForm {
		params = append(params, fmt.Sprintf(`%v: %v`, strconv.Quote(k), strconv.Quote(v[0])))
	}
	paramsString := "{" + strings.Join(params, ",") + "}"

	callback := r.FormValue("js")
	if callback == "" {
		callback = "parent.callback"
	}

	JSONCallback(w, callback, paramsString, http.StatusCreated)
}

func JSONCallback(w http.ResponseWriter, callback string, params string, code int) {
	response := fmt.Sprintf("<html><head><script>%v(%v)</script></head><body>%v(%v)</body></html>", callback, params, callback, params)

	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(code)
	io.WriteString(w, response)
}
