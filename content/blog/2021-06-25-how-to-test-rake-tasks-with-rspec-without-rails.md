---
title: "How to Test Rake Tasks in RSpec Without Rails"
date: 2021-02-25T13:51:51-05:00
keywords: rspc, rails
audio:
description:
images:
series:
tags:
videos:

---

Recently in a Ruby project that does not use Rails, I had to write a Rake task. I wanted to be sure it was tested, but I couldn't figure out how to load the task in the test environment.

Thanks to [RSpec Tests for Rake Tasks](https://medium.com/@jelaniwoods/rspec-tests-for-rake-tasks-da7985896014) I was able to get the majority of the setup done. But that post is for Rails projects!

Want the TL;DR? Skip to the code below and look for the line with `Rake::DefaultLoader.new.load`.

## Writing a Rake Task

I put the tasks in `lib/tasks/` and organize them by namespace. So this task lives in `lib/tasks/authors.rake`.

```rb
namespace :authors do
  desc 'Migrate Author Names'
  task :migrate_names do
    Authors.find_each do |author|
      author.update!(full_name: "#{author.first_name} #{author.last_name")
    end
  end
end
```

## Loading the Tasks Into Rake

This lets you run `rake authors:migrate_names`. Add this line to your Rakefile.

```rb
Dir.glob('lib/tasks/*.rake').each { |r| load r }
```

## Loading the Tasks in RSpec

The code below does a few things:
1. Creates a module that allows you to name a test `rake authors:create` and will load a `subject` named `task` that returns the rake task.
2. Loads all the rake tasks into memory using `Rake::DefaultLoader`. Since we're not calling `rake` directly in the tests, we need this line to tell the tests where our tasks live.
3. Adds metadata to any file in `spec/tasks` so that RSpec knows these are `task` tests and need the `TaskFormat` module loaded.

```ruby
require 'rake'

module TaskFormat
  extend ActiveSupport::Concern
  included do
    let(:task_name) { self.class.top_level_description.sub(/\Arake /, '') }
    let(:tasks) { Rake::Task }
    # Make the Rake task available as `task` in your examples:
    subject(:task) { tasks[task_name] }
  end
end

RSpec.configure do |config|
  config.before(:suite) do
    Dir.glob('lib/tasks/*.rake').each { |r| Rake::DefaultLoader.new.load r }
  end

  # Tag Rake specs with `:task` metadata or put them in the spec/tasks dir
  config.define_derived_metadata(file_path: %r{/spec/tasks/}) do |metadata|
    metadata[:type] = :task
  end

  config.include TaskFormat, type: :task
end
```

## Writing the Tests

Now lets write tests! The tests below use [verifying doubles](https://relishapp.com/rspec/rspec-mocks/v/3-10/docs/verifying-doubles) to avoid database transactions, but how you write your tests is up to you!

```rb
require_relative '../../support/tasks'

describe 'rake authors:migrate_names', type: :task do
  let(:author_cls_double) { class_double(Author).as_stubbed_const(transfer_nested_constants: true) }
  let(:author_double) { instance_double(Author, first_name: 'Cassidy', last_name: 'Scheffer') }
  let(:expected_name) { 'Cassidy Scheffer'

  before do
    allow(author_cls_double).to receive(:find_each).and_yield(author_double)
    allow(author_double).to receive(:update!).with({ full_name: expected_name })
    task.execute
  end

  it 'updates the correct fields' do
    expect(author_double).to have_received(:update!).with({ full_name: expected_name })
  end
end
```
