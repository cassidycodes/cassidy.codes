---
title: "Shared Examples and Contexts in RSpec"
date: 2019-09-28T12:54:41-04:00
keywords:
  - RSpec
  - Shared Examples
  - Shared Contexts
  - Testing
audio:
description: How to use shared examples and shared contexts in RSpec!
images:
  - images/posts/rspec-logo.png
series:
  - Ruby
  - Ruby on Rails
  - Testing
tags:
videos:

---

When I first learned testing in Rails, I learned [RSpec](http://rspec.info/), but then in my last job, I wrote most of my tests in [minitest](https://github.com/seattlerb/minitest). I enjoyed the challenge of learning a new test framework and found the tests super fast!

But recently, I've been working on a project in RSpec again and I have a renewed appreciation for it! In this post, I'm going to talk about how to define and use shared examples and shared contexts in RSpec.

I'm going to start with shared examples here because shared contexts are very similar in how you set them up.

## Shared Examples

Shared examples are a set of examples that you want to use in multiple files. You'll want to use shared examples when you're writing a Module or a [Concern](https://api.rubyonrails.org/classes/ActiveSupport/Concern.html) in Rails.

In this example below, we have two models, `Door` and `Phone`, and they both can be locked. When we lock one of these things, we set an attribute on the model called `locked_at`, which is a timestamp of when the item was locked.

```ruby
# app/models/door.rb
class Door < ApplicationRecord
  include Lockable
end

# app/models/phone.rb
class Phone < ApplicationRecord
  include Lockable
end

# app/models/concerns/lockable.rb
module Lockable
  extend ActiveSupport::Concern

  included do
    scope :locked, -> { where.not(locked_at: nil)  }
    scope :locked_between, (start_time, end_time)-> { where(locked_at: start_time..end_time)  }
  end

  def lock!
    update locked_at: Time.zone.now
  end
end
```

You can see here that both models share some functionality through the `Lockable` module. This module lets us lock items and find all items that are locked.

Our tests can then be set up like this:

```ruby
# spec/models/door_spec.rb
RSpec.describe Door, type: :model do
  it_behaves_like 'Lockable'
end

# spec/models/phone_spec.rb
RSpec.describe Phone, type: :model do
  it_behaves_like 'Lockable'
end

# spec/support/shared_examples/lockable_spec.rb
RSpec.shared_examples 'Lockable' do
  subject { described_class.create }

  describe '#lock' do
    it 'sets locked_at to current time' do
      freeze_time do
        expect { subject.lock! }.to change { subject.locked_at }.from(nil).to(Time.now.utc)
      end
    end
  end
end
```

Now when we run our model tests, we get two passing tests. One for each model!

```
$ bundle exec rspec spec/models/
..

Finished in 0.02916 seconds (files took 1.28 seconds to load)
2 examples, 0 failures
```

### Parameters

What happens if you need to pass some parameters that might be different in one context but not the other? Shared examples accept parameters! In the example below, I am creating an instance of the subject class and passing it into the shared example.

```ruby
# spec/models/door_spec.rb
RSpec.describe Door, type: :model do
  it_behaves_like 'Lockable', Time.now.utc
end

# spec/models/phone_spec.rb
RSpec.describe Phone, type: :model do
  it_behaves_like 'Lockable', Time.now.utc
end

# spec/support/shared_examples/lockable_spec.rb
RSpec.shared_examples 'Lockable' do |time|
  subject { described_class.create  }

  describe '#lock' do
    it 'sets locked_at to current time' do
      freeze_time do
        expect { subject.lock! }.to change { subject.locked_at }.from(nil).to(time)
      end
    end
  end
end
```

### Gotchas!

RSpec doesn't auto-load any files for you! You'll see that I've put my shared examples in `spec/support/shared_examples/`. You need to tell RSpec to `require` this file.

```ruby
# spec/rails_helper.rb
Dir["./spec/support/**/*.rb"].sort.each { |f| require f  }
```

## Shared Contexts

What about times when you have to do a whole bunch of contextual setup in your tests? It gets super annoying when you have to do this setup twice. Shared contexts define code that will be evaluated before the tests run.

Let's add a method called `locked?` to our module so that we can see if a door or phone is locked.

```ruby
# app/models/concerns/lockable.rb
module Lockable
  extend ActiveSupport::Concern

  # Other code excluded for brevity.

  def locked?
    locked_at.present?
  end
end
```

Now we want to add a shared context that creates a new `subject` for us. I'm also going to define a `locked_at` `let` block here.

```ruby
# spec/support/shared_contexts/locked_at.rb
RSpec.shared_context 'locked_at' do
  let(:locked_at) { nil }
  subject { described_class.new(locked_at: locked_at) }
end
```

And finally, lets add some tests to our shared examples for lockable:

```ruby
# spec/support/shared_examples/lockable_spec.rb
RSpec.shared_examples 'Lockable' do
  subject { described_class.create }

  # Other code excluded for brevity.

  describe '#locked?' do
    context 'it is not locked' do
      include_context 'locked_at'

      it 'returns true' do
        expect(subject.locked?).to be false
      end
    end

    context 'it is locked' do
      include_context 'locked_at' do
        let(:locked_at) { Time.now.utc }
      end

      it 'returns false' do
        expect(subject.locked?).to be true
      end
    end
  end
end
```

Here, the shared context is setting up a new subject for us. When we want to change one of the parameters of the context, we can use a block. In the test to ensure a subject is locked, you can see I have overridden the `locked_at` variable.

## Conclusion

I would choose carefully when implementing these though! Like [Sandi Metz says](https://www.sandimetz.com/blog/2016/1/20/the-wrong-abstraction), "duplication is far cheaper than the wrong abstraction."

If you find your shared contexts always have a block that overrides some defaults, or your shared examples require lots of parameters to set up, you might have the wrong abstraction.

Shared contexts and examples are great for cleaning up your code when you need them though!

You can find the code from this post over on GitHub: https://github.com/cassidycodes/rspec-examples

