---
title: "I learned Go!
date: 2019-09-22T13:36:38-04:00
---

This weekend I went to a workshopt to learn Go that was organized by [Denise Yu](https://twitter.com/deniseyu21). I wasn't able to stay for the whole thing, but I got so learn some fundmentals of Go. It was really nice to focus a day learning something new.

## GOPATH

The first thing that caught me off guard was how Go looks for Go code. In the workshop, they glased over this topic by suggesting that everyone start writing code in `~/go`. It makes sense to me that they did that so that people could focus on wirting code rahter than configuring theie setup. But of couse, I did things differently and this broke all sorts of stuff!

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
# Set GOPATH to current dirextory and give helpful feedback.
alias setgopath="export GOPATH=`pwd` && echo \"GOPATH is set to $GOPATH\""
# Really tiny alias because I'm lazy.
alias sgp=setgopath
```

So now when I tried to run my `main.go` code, the gopath was set to `myproject` and Go was able to find `mylibrary`.

_NOTE_: If you're on a different system, [Go has docs on how to set your GOPATH](https://github.com/golang/go/wiki/SettingGOPATH)

## `src` is Inferred!

Go looks for three directories in the `GOPATH`:

1. `src` holds source code for your libraries.
2. `bin` holds compiled binaries for your libraries.
3. `pkg` holds compiled package objects.

Here's something I don't know. What's the difference between a compiled binary and a compiled package object? Hrm...maybe that's a blog post for another day.

## Language Basics

OK, enough configuration! Let's talk about some language basics.

### Values
### Variables
### Constants
### For
### If/Else
### Switch
### Arrays
### Slices
### Range
