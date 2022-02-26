---
title: "Using Factories in Ruby to Refactor if Statements "
date: 2020-05-15T09:28:10-05:00
keywords:
  - factories
  - refactoring
audio:
description:
images:
  - rspec-logo.png
series:
tags:
videos:

---

In two separate code reviews this week I dug up a trusty old article that I use when trying to refactor conditionals in Ruby. I've referred back to Ian Whitney's article [Refactoring away a conditional](http://designisrefactoring.com/2015/03/09/refactoring-away-a-conditional/) so many times over the years.

Today, I thought I'd try explain this pattern myself based on some recent work.

## The Problem: Sending Messages

Before I start I should note that I didn't do the work I've outlined below. Other talented engineers on my team implemented it! This post is inspired by our discussion in person and through code review. The code samples below are very much pseudo-code that I hammered out while writing this post and don't reflect the real code in our application.

In our app at work, we have a messaging interface where a director can send messages to a predefined mailing list. Those mailing lists can be: 

1. All centres that they manage.
2. One of the centres they manage.
3. All of the customers for one centre.

The director uses one interface to compose their message and chooses one of the three options above. When our application receives the request, it routes the data to the correct mailer to send the message to the recipients.

Like any code base that's been around for a while, the three different branches here all had different interfaces. One called a Sidekiq worker, and two of them called a `MessageSender` service with different params.

We were working on adding a new feature to this messaging system that scheduled messages to be sent at a future date. This meant that we needed to take some of the older code that was in a controller and put it in a background job. 

There was LOTS of opportunity for refactoring here, but we really needed to keep the scope of this work under control.

So, how do we decide which of the existing message sending methods to use?

## Rough Draft: A Message Handler

The first step was to gather all the parts in one place. Have you ever cleaned out old desk drawers? Well, this is a similar process. We found all the related parts and group them together so we could best decide what to do with them.

Here's an example of what that looked like. Note that I've simplified this to keep it short.

```ruby
class ScheduledMessageHandler
  attr_accessor :scheduled_message

  def initialize(id)
    @scheduled_message = ScheduledMessage.find(id)
  end

  def call
    if to_customers?
      CustomerMessageWorker.perform_async(customer_message_params)
    else
      CentreMessageSenderService.call(centre_message_params)
    end
  end

  private

  def to_customers?
    scheduled_message.send_to == 'Customers'
  end

  def customer_message_params
    # Extract necessary params
  end

  def centre_message_params
    params = scheduled_message.slice(:message, :subject)
    to_all_centres? ? params.merge(centre_ids: centre_ids) : params.merge(centre_id: centre_id)
  end

  def to_all_centres?
    scheduled_message.send_to == 'All Centres'
  end

  def centre_ids
    # Determine centre ids
  end

  def centre_id
    # Determine centre id
  end
end
```

Great! We have all the parts we need assembled in one place here. Lets take a look at what this is doing.

## What are we actually doing?

At a glance, it looks like this class is deciding between two different classes, right?

But! There's conditional hidden later on. Take a look at this flow chart. First we decide which class to use, and if we end up in the branch that sends to centres, we decide what the params should look like.

![A flow chart indicating that this class has three possible outcomes.](https://dev-to-uploads.s3.amazonaws.com/i/1qf8lbg60oxgemicuabr.jpg)

A real good hint that this `ScheduledMessageHander` knows too much is that there are two separate methods that end in `params`, and only one of them will get used any time we call this class.

## A Refactor: Three Classes with the Same Interface

Here's where we can use a Factory to refactor away this conditional. The trick, though, is that the factory needs to return an object with the same interface no matter which branch of the decision tree we end up at.

Since we're trying to isolate these changes because we don't have time to pull apart all of the `CustomerMessageWorker` and `CentreMessageSenderService` classes, let's make sure they have the same interface.

```ruby
class CustomerMessageSender
  def initialize(message_params = {})
    @message_params = message_params
  end
  
  def call
    CustomerMessageWorker.perform_async(message_params)
  end

  private

  def message_params
    # Extract necessary params
  end
end
```

Ok, so now we have two `MessageSender` classes that have the same `call` interface. We can pass all of the `message_params` into the `CustomerMessageSender` and it knows which params it needs to call the worker.,

Next, lets look how we use the `CentreMessageSenderService` class. We don't want to crack that open for a refactor, but we do know that it does two things: 1. Sends messages to one centre, and 2. Sends messages to many centres.

Lets do something similar where we wrap the param extraction logic into two separate classes.

```ruby
class CentreMessageSender
  def initialize(message_params = {})
    @message_params = message_params
  end
  
  def call
    CentreMessageSenderService.call(message_params)
  end

  private

  def message_params
    message_params.slice(:message, :subject).merge(centre_id: centre_id)
  end

  def centre_id
    # Determine centre_id
  end
end

class CentresMessageSender
  def initialize(message_params = {})
    @message_params = message_params
  end
  
  def call
    CentreMessageSenderService.call(message_params)
  end

  private

  def message_params
    message_params.slice(:message, :subject).merge(centre_ids: centre_ids)
  end

  def centre_ids
    # Determine centre_ids
  end
end
```

## Message Sender Factory: Deciding which Class we Need

Now we have three classes that have the same interface. We can pass all of the message parameters into any one of the classes and they will extract the parameters they need and send the message!

But, how do we pick the right class? Remember those conditionals we were talking about? 

Let's start by adding a `match?` method to each class that tells us if it matches the conditions for using that class.

```ruby
class CustomerMessageSender
  def self.match?(send_to)
    send_to == 'Customers'
  end
end

class CentreMessageSender
  def self.match?(send_to)
    send_to == 'Centre'
  end
end

class CentresMessageSender
  def self.match?(send_to)
    send_to == 'All Centres'
  end
end
```

And finally, lets make a factory class that can find the right message sender for us:

```ruby
class MessageSenderFactory
  MESSAGE_SENDERS = [
    CustomerMessageSender,
    CentreMessageSender,
    CentresMessageSender,
  ]

  def self.build(message_params)
    send_to = message_params[:send_to]
    klass = MESSAGE_SENDERS.find { |sender| sender.match?(send_to) }
    klass.new(message_params)
  end
end
```

Our factory class is now using the `match?` class method on each of the message sender classes to decide which class to use. It then initializes a new class and returns it to us.

Here's what using it looks like now:

```ruby
message_sender = MessageSenderFactory.build(message_params)
message_sender.call
```

## Notes and Thoughts

The original article I referenced above is called "Refactoring away a conditional", which seems correct because we're no longer using `if` `else` statements. But! We still have conditions, which live in the `match?` method. The difference here is that we've flattened the decision tree. Now we make one decision with three possible outcomes rather than two decisions with three possible outcomes.

### Naming is Hard!

The names in my examples don't actually match what is in our application. I find the similarity between `CentreMessageSender` and `CentresMessageSender` really hard to distinguish. Perhaps I could spend some time picking better names here.

## Deciding when to Refactor is Hard!

It is! I would have loved to revamp some of the classes behind this work. But the scope of that work would have been pretty significant in comparison to the project we were working on. 

Refactoring an old code base is a little like tidying your house one day at a time. Want to read about that? Here's an amazing thread from Sarah Mei about code hoarding: 

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">I&#39;ve been thinking about how the konmari method applies to codebases. I&#39;ve been doing a lightweight version of it with my physical stuff.</p>&mdash; Sarah Mei (@sarahmei) <a href="https://twitter.com/sarahmei/status/783103760281182208?ref_src=twsrc%5Etfw">October 4, 2016</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> 
