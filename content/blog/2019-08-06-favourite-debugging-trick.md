---
title: "2019 08 06 Favourite Debugging Trick"
date: 2019-08-06T23:37:38-04:00
---

Last week I wrote about some of my favourite debugging tools in Ruby. I forgot one trick that I find super useful!

Today I was writing a script that would iterate through objects in an S3 bucket and group these objects by similar names. The naming structure looked like this:

```text
original.jpg
tumb_original.jpg
profile_original.jpg
```

So all three of those images should get grouped together because they all come from `orignal.jpg`. But I got my name comparison muddled and something wasn't working right. It would work perfectly for 200 images then it blew up on the 201st!

Printing logs or putting a binding in a loop like this is gnarly. I don't want to loop through 200 successful iterations to find what I need!

## Conditional Bindings!

To solve this problem, I just made my binding conditional.

```ruby
s3_objects.each do |img|
  binding.pry if img.key =~ /badfilename.jpg/
end
```

This time we'll only hit the binding if the image key contains the filename that's giving me grief!

