---
title: "Debugging in Rails"
date: 2019-08-01T22:23:11-04:00
---

This week I got to dig into some debugging that I really enjoyed. Well, if you had asked me in the middle of it I might not have been having fun, but I found a solution! I used a handful of tools to approach debugging and they all gave me a little bit more information to solve the problem that I didn't have before. 

Here is a bit of information on each tool that I used. Let me know if you have other Ruby or Rails debugging tips!

## Pry!

[Pry](https://pryrepl.org/) is an amazing tool for Ruby. It gives you all kinds of tools like `? my_method` to show you documentation or `ls MyObject` to show you all the methods you can call on an object. You can even use `cd` to move into an object!

Here is a tiny class with a pry binding in it to show you how a few of the methods work.

```ruby
class User
  def initialize(name)
    @name = name
  end
  
  def name
    binding.pry
    @name
  end
end
```

I started up from the command line and initialized a new user. When I call the `name` method, Pry prints out the lines around the binding and gives you an interactive prompt. 

```text
[1] pry(main)> me = User.new('cassidy')
=> #<User:0x00007fd807ed87a8 @name="cassidy">
[2] pry(main)> me.name

From: (pry) @ line 9 User#name:

     7: def name
     8:   binding.pry
 =>  9:   @name
    10: end
[1] pry(#<User>)> 
```

At this point I could type `@name` to see what the value of my instance variable is.

```text
[1] pry(#<User>)> @name
=> "cassidy"
```

Ah good, it's what I expected. Let's use `step` to move the execution forward one more frame.

```text
[2] pry(#<User>)> step
From: /Users/cassidy/.rbenv/versions/2.3.8/lib/ruby/gems/2.3.0/gems/pry-0.12.2/lib/pry/pry_instance.rb @ line 388 Pry#evaluate_ruby:

    383: def evaluate_ruby(code)
    384:   inject_sticky_locals!
    385:   exec_hook :before_eval, code, self
    386:
    387:   result = current_binding.eval(code, Pry.eval_path, Pry.current_line)
 => 388:   set_last_result(result, code)
    389: ensure
    390:   update_input_history(code)
    391:   exec_hook :after_eval, result, self
    392: end

[1] pry(#<Pry>)>
```

Neat! It looks like the next frame is Pry itself! Ever wonder how pry works? Check out all the methods that are here!

```text
[1] pry(#<Pry>)> ls
Pry#methods:
  add_sticky_local  commands=            eval                 extra_sticky_locals=   last_dir                   memory_size   print                   quiet?             should_print?
  backtrace         complete             eval_string          hooks                  last_dir=                  memory_size=  print=                  raise_up           show_result
  backtrace=        config               eval_string=         hooks=                 last_exception             output        process_command         raise_up!          sticky_locals
  binding_stack     current_binding      evaluate_ruby        inject_local           last_exception=            output=       process_command_safely  raise_up_common    suppress_output
  binding_stack=    current_context      exception_handler    inject_sticky_locals!  last_file                  output_array  prompt                  repl               suppress_output=
  color             custom_completions   exception_handler=   input                  last_file=                 output_ring   prompt=                 reset_eval_string  update_input_history
  color=            custom_completions=  exec_hook            input=                 last_result                pager         push_binding            run_command
  command_state     editor               exit_value           input_array            last_result=               pager=        push_initial_binding    select_prompt
  commands          editor=              extra_sticky_locals  input_ring             last_result_is_exception?  pop_prompt    push_prompt             set_last_result
instance variables:
  @backtrace      @command_state  @custom_completions  @indent      @last_exception  @last_result_is_exception  @prompt_stack  @suppress_output
  @binding_stack  @config         @eval_string         @input_ring  @last_result     @output_ring               @stopped
locals: _  __  _dir_  _ex_  _file_  _in_  _out_  _pry_  code  result
```

I'm not going to dig around in there too much, but lets see what `next` does.

```text
From: /Users/cassidy/.rbenv/versions/2.3.8/lib/ruby/gems/2.3.0/gems/pry-0.12.2/lib/pry/pry_instance.rb @ line 390 Pry#evaluate_ruby:

    383: def evaluate_ruby(code)
    384:   inject_sticky_locals!
    385:   exec_hook :before_eval, code, self
    386:
    387:   result = current_binding.eval(code, Pry.eval_path, Pry.current_line)
    388:   set_last_result(result, code)
    389: ensure
 => 390:   update_input_history(code)
    391:   exec_hook :after_eval, result, self
    392: end
```

It moved us one line forward in the current frame. So behind the scenes, it executed all of line 38 and returned us to this same stack frame because there was more code to execute here. Neat!

Okay, enough fiddling around with pry. Let's type `continue` and we'll finally see the result of the `name` method.

```text.
[1] pry(#<Pry>)> continue
=> "cassidy"
```

## Bundle Open

What happens when you start stepping through a call stack and you find yourself wandering around stack frames that belong to a Ruby Gem you're using. This happens to me a lot and sometimes I like to go right to the source.

Here's the error I was working on today. You'll see that the error is raised in a third party library. I might have made a mistake that caused it, but my mistake is so far down the call stack that I don't see it!

```text
2019-08-01T21:42:43.628Z 34126 TID-ower3a8uc WARN: NoMethodError: undefined method `body' for nil:NilClass
2019-08-01T21:42:43.628Z 34126 TID-ower3a8uc WARN: /Users/cassidy/.rbenv/versions/2.3.8/lib/ruby/gems/2.3.0/gems/carrierwave-0.10.0/lib/carrierwave/storage/fog.rb:228:in `read'
/Users/cassidy/.rbenv/versions/2.3.8/lib/ruby/gems/2.3.0/gems/carrierwave-0.10.0/lib/carrierwave/uploader/cache.rb:77:in `sanitized_file'
/Users/cassidy/.rbenv/versions/2.3.8/lib/ruby/gems/2.3.0/gems/carrierwave-0.10.0/lib/carrierwave/uploader/cache.rb:116:in `cache!'
/Users/cassidy/.rbenv/versions/2.3.8/lib/ruby/gems/2.3.0/gems/carrierwave-0.10.0/lib/carrierwave/uploader/versions.rb:226:in `recreate_versions!'
/Users/cassidy/.rbenv/versions/2.3.8/lib/ruby/gems/2.3.0/gems/carrierwave_backgrounder-0.4.2/lib/backgrounder/workers/process_asset.rb:12:in `perform'`
```

I had no idea what was `nil` here that shouldn't be so I ran `bundle open carrierwave` to open the gem's codebase in a text editor. Once I was there, I found the line where the error was raised and put a `binding.pry` in it so I could get some better insight as to what was going on.


## `puts`!!!

Sometimes pry isn't going to work for you. This is especially true if you're using a multi-threaded server or Sidekiq to process background jobs. When this happens, you'll get an interactive prompt for a few seconds then you'll get booted out because another process is trying to write logs to the same master process. Argh! This can be frustrating.

My favourite thing to do here is to print my own logs. I try to make these stand out so I don't miss them when the logs are going by. Here's some pseudocode that resembles the problem I was solving today.

```ruby
def filename
   puts '---------------------'
   puts 'in filename'
   puts model.attributes['image']
   puts model.persisted?
   puts model.image_changed?
   puts '---------------------'
   retur nmodel.attributes['image'] if model.persisted? && !model.image_changed?

   new_filename = "#{SecureRandom.hex}.#{file&.extension}"
   puts new_filename
   new_filename
end
```

This gave me some clear output so I could see what was happening each time this method was called. The great thing about `puts` debugging is that you're never wondering if you lost count of which iteration you're on when a method gets called multiple times. 

## Conclusion

When I was working on my problem today, I used all three of these tools together. Pry is my go-to, but when that isn't enough, I'll reach for something else. I ended up learning lots about the CarrierWave life cycle that will make the rest of my task so much easier! I even learned about some methods CarrierWave has that aren't documented.
