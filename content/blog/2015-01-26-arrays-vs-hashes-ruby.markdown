+++
date = "2015-01-26"
title = "Arrays vs Hashes in Ruby"
slug = "2015/01/26/arrays-vs-hashes-ruby"
+++

This weekend I created a small, Ruby CRM application that stores contact information. You can check out my code on [GitHub](https://github.com/CivicImages/CRM_App). While I was building this app, most people were using an array to store their contact information, but I wanted to use a Hash. I kew that theoretically Hashes are fster than Arrays, but I didn't know why.

## Arrays vs Hashes

The quick answer is that Hashes in Ruby are more easily accessible than an item in an array. Check out the video below that explains how this works. If you don't want to watch the whole thing, my notes are below.


<div class="embed-responsive embed-responsive-16by9" style="margin-bottom: 1.5rem;">
  <iframe width="740" height="416" src="//www.youtube.com/embed/YHULcgaATh4" frameborder="0" allowfullscreen></iframe>
</div>

Ruby sorts key-value pairs into one of 11 bins. It does this using a a method called `hash`. `hash` returns a really big number on any object. Try calling `12345.hash` or `"abcde".hash`. Every time you call it on the same value, you'll get the same really huge number.
{{< highlight ruby >}}
12345.hash
=> -4392066022887924543
{{< / highlight >}}
Ruby then gets the modulus of of this number when divided by 11. So any number `% 11` will give us a value between 0 and 10. The key-value pair will then be stored in that bin.
{{< highlight ruby >}}
12345.hash % 11
=> 3 # This would go into bin 3
{{< / highlight >}}
When you call a `key` from a hash, Ruby calculates the modulus again and goes right to the bin where this value was stored. So in a hash, the `key` serves as a shortcut right to the information stored in the `value`.

## What are Enumerables

"Enumerable" is a word that confused me at when I first saw it. The Ruby Docs say, "The `Enumerable` mixin provides collection classes with several traversal and searching methods, and with the ability to sort." Uuh, okay.

When I call `Enumerable.class` in Pry it tells me that Enumerables are a `Module`. I know that a module is a functionality that is shared between otherwise unrelated `Classes`. So this means that an `Enumerable` lets you search or move through classes that are collections of things, like `Arrays` and `Hahses`.

In my CRM I used `.find_all` in my original `search_contacts` method. When I did this I noticed that the method was returning the result plus the whole hash itself. Here, I have to assign the result to a variable the end the method by returning that variable. If I simply had `@contacts.find_all { ... }` as my last line, my search function would return all the contacts and then return the entire Hash that I searched.

## Searching the Hash

For the time being, I am searching for individual contacts by calling the contact ID, or the `key` in the Hash. But I want to be able to search for contacts by the content of any value. So you could input "jekyll" and the app will retrun all contacts with "jekyll" in any variable. Any idea how to do that?

I have tried iterating through the hash and using `.find_all`. I've also built my own search method, but right now, neither of those are working for me. I think `find_all` doesn't work because the values stored in the Hash are instances of the class, and not just a `string` or `int`.

Another question I have is, if you are searching a Hash for all entries that match a value, is a Hash stil faster than an array? In other words, is it faster to load Hash bins individually than it is to load the whole array?

Have an answer for this? I'd love to hear it.
