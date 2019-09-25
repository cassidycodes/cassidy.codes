---
title: "Learning Go"
date: 2019-09-22T21:37:54-04:00
keywords:
  - Golang
  - Go
  - Go Basics
  - Workshop
audio: []
description: I went to a workshop to learn Go this weekend. Here's what I learned!
images:
  - images/posts/go-workshop/skeletons.jpg
series: ["go"]
tags: []
videos: []

---



This weekend I went to a workshop to learn Go that was organized by [Denise Yu](https://twitter.com/deniseyu21). I wasn't able to stay for the whole thing, but I got so learn some fundamentals of Go. It was really nice to focus a day learning something new.


## GOPATH

The first thing that caught me off guard was how Go looks for Go code. In the workshop, they glazed over this topic by suggesting that everyone start writing code in `~/go`. It makes sense to me that they did that so that people could focus on writing code rather than configuring their setup. But of course, I did things differently and this broke all sorts of stuff!

According to the [Go Language Docs](https://golang.org/cmd/go/#hdr-GOPATH_environment_variable), the `GOPATH` environment variable lists all the places on your computer to look for Go code. So when you write `import "mylibrary"`, Go will look inside all the directories listed in the `GOPATH` to find `mylibrary`.

When I had a directory structure like this:

```
myproject
  main.go
  src
    mylibrary
      mylibrary
```

Go couldn't find my library! This is because my `GOPATH` was empty and Go looked in the default location, which was `~/go`. My code lived somewhere else!

One of the TAs at the event said that he sets the `GOPATH` every time he `cd`s into a new project. I decided to make an alias for this so that I could set the `GOPATH` quickly when I moved into a new directory.

```bash
# Set GOPATH to current directory and give helpful feedback.
alias setgopath="export GOPATH=`pwd` && echo \"GOPATH is set to $GOPATH\""
# Really tiny alias because I'm lazy.
alias sgp=setgopath
```

So now when I tried to run my `main.go` code, the GOPATH was set to `myproject` and Go was able to find `mylibrary`.

_NOTE_: If you're on a different system, [Go has docs on how to set your GOPATH](https://github.com/golang/go/wiki/SettingGOPATH)

## `src` is Inferred!

Go looks for three directories in the `GOPATH`:

1. `src` holds source code for your libraries.
2. `bin` holds compiled binaries for your libraries.
3. `pkg` holds compiled package objects.

Here's something I don't know. What's the difference between a compiled binary and a compiled package object? Hrm...maybe that's a blog post for another day.

## Basic structure of a file.

```go
// This line tells you what the package name is. Packages with the name `main` are are usually compiled into a standalone binary. Packages that are meant to be used by other Go programs will have another name, like myStringTools, for example.
package main

// The import statement tells us what packages to import. I'm going to import fmt here because it gives us tools for formatting out put to the console.
import "fmt"

// The entry point! We named our package main, and the entry point matches. When we build this program as a binary, this is the function that will get called.
func main() {
  fmt.PrintLn("Don't go! Stay!")
}
```

## Language Basics

### Values

Go has all the common value types like strings, integers, floats, and booleans. One thing I found interesting is that strings cannot be declared with single quotes. They either need to use backticks (for string literals) or double quotes.

Single quotes are used to denote "[runes](https://devdocs.io/go/builtin/index#rune)", which I don't totally understand, but they seem to stand in for 32-bit integers in some way.

### Variables

Go is a strongly typed language. Meaning once you've told Go that a certain variable is an integer, for example, Go will expect that variable to always be an integer.

There are two ways to declare a variable:

```go
package main

import "fmt"

// Declare the variable and its type in the global scope.
var myInt int
// Assign a value to it!
myInt = 1

// Variables assigned with a capital letter at the beginning will be imported into other files when you use `import`.
var MyExport int

func main() {
  // := lets you declare and assign a value in one line!
  myOtherInt := 1
}

```

One trick with `:=` is that you cannot use it in the global scope. You can only declare and assign variables in this way inside of a function.

Values in Go have what's called a _zero-value_. This means that if you've declared a variable but you have not assigned a value, it has a default value. For integers, this is zero, for strings it's an empty string.

### For

`for` loops look very familiar to me:

```go
package main

import "fmt"

func main() {
  for i := 1; i <= 10; i++ {
    fmt.Println(j)
  }
}
```

The first section is the local variable inside of the loop. The second section is the condition, in this case, keep looping until `i` is less than or equal to 10. And the third section is what to do when at the end of the loop. Here we're saying to increment `i` by one.

### Arrays & Slices

I thought the implementation of arrays and slices to be interesting. Arrays are numbered lists. In a language like Ruby, you can keep tacking data on to the end of an array without worrying about how big it's getting.

In Go, you can't do that. If I declare an array like this: `var a [5]int`. Go create an array of five integers with their zero-values: `[0,0,0,0,0]`. I cannot add any more items to this array! Why's that? Programs need to ask the underlying operating system for space in memory. If I ask for enough room for five integers, that's all I get! Need more? We'll I'd have to ask for more then copy my original array over to the new array.

Sounds like lots of work, right? We'll check out a slice!

A slice is like an array, but some of the heavy lifting is built into it. Need to add more data to the end of a slice? Go ahead!

To create a slice, you use the builtin function `make`, which is used to initialize [slices, maps, and chans](https://devdocs.io/go/builtin/index#make). What's a chan? Good question. But I'll leave that for another blog post because I have no idea.

```go
package main

import(
  "fmt"
  "strings"
)

func main() {
  // Initialize a slice with members.
  mySlice := make([]string, 4)

  mySlice[0] = "My"
  mySlice[1] = "slice"
  mySlice[2] = "of"
  mySlice[3] = "pizza"
  // Append two strings to the slice!
  append(mySlice, "is", "good!")

  fmt.PrintLn(strings.Join(mySlice, " "))
  // => My slice of pizza is good!
}
```

### Range

Final one for today. Ranges! I'm not totally sure I have the language right here, but a range seems to be an iterator or enumerator. If you have slice, for example, you can use it to iterate over the data in a `for` loop.

```go
package main

import "fmt"

func main() {
  sentence := "My slice of pizza is good."
  words = strings.Split(sentence, " ")

  for index, word := range words {
    fmt.Println(word)
  }
  // => My
  // => slice
  // => of
  // => pizza
  // => is
  // => good.
}
```

## Conclusion

I had fun learning Go! The language feels very familiar to me. The things I've found tricky so far were understanding what a range was, and figuring out my `GOPATH`. I'm happy I could figure those things out and write a few programs that worked. I'm sure if I worked in Go more frequently, I'd find something new go get stumped on though!


You can checkout all my code from the workshop at the links below. I'll also link to the guide we were using.

My code: https://github.com/cassidycodes/hellogo

Practical Go: https://idiomat.gitbook.io/gobridge/
