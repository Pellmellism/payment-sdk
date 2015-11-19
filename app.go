package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)
	http.HandleFunc("/callback", callbackHandler)

	log.Println("Listening...")
	http.ListenAndServe(":3000", nil)
}

func callbackHandler(w http.ResponseWriter, r *http.Request) {
	b, _ := ioutil.ReadAll(r.Body)
	fmt.Fprintf(w, string(b))
}
