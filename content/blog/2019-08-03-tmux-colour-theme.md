---
title: "Creating a tmux Colour Theme"
date: 2019-08-03T15:22:43-04:00
---

I recently decided to use the [Dracula](https://draculatheme.com/) in my coding environment. Love it or hate it, I've been working with Vim and [tmux](https://github.com/tmux/tmux) for the past two years and I inherited my Vim and tmux configurations from someone else. I dove head first into this environment and got used to it pretty quickly, but I never spent much time configuring it.

When I switched Vim over to Dracula, I immediately realized that I needed to change my tmux colours too! 

Here's how I approached writing a theme in my tmux config. But first, this is what it looks like! 😍

[![a screenshot of a terminal with a tmux window](/images/posts/tmux-theme/tmux-dracula.png)](/images/posts/tmux-theme/tmux-dracula.png)

## General Setup

First, I wanted all the hex codes for Dracula colours right in front of me so I didn't have to keep switching to a browser window. Then, lets tell tmux to use a terminal that supports colours.

You'll notice that I'm using the hex codes for these colours. tmux supports passing hex codes in to the configs, but it will convert the hex code to the closest 256color.

```tmux
# Dracula Colours
# background_color '#282a36'
# current_line_color '#44475a'
# foreground_color '#f8f8f2'
# comment_color '#6272a4'
# cyan '#8be9fd'
# green '#50fa7b'
# orange '#ffb86c'
# pink '#ff79c6'
# purple '#bd93f9'
# red '#ff5555'
# yellow '#f1fa8c'

set -g default-terminal "screen-256color"
```

## Borders

a tmux session can have windows and windows have panes. Each pane is a separate terminal session and each window can have one or more terminal sessions. If you're familiar with iTerm, think of panes like a horizontal or vertical split.

```tmux
# pane border
set -g pane-border-style fg='#6272a4'
set -g pane-active-border-style fg='#ff79c6'
```

Here we've set two styles. The default border colour is Dracula's dark purple comment colour. tumx style directives are a comma-separated list of styles for foreground, `fg`, and background `bg`. 

`fg` and `bg` each accept a colour and a list of attributes. The tmux docs gives a list of all the attributes you can use: 

>The attributes is either none or a comma-delimited list of one or more of: `bright` (or `bold`), `dim`, `underscore`, `blink`, `reverse`, `hidden`, `italics`, or `strikethrough` to turn an attribute on, or an attribute prefixed with `no` to turn one off.

These two styles tell tmux to make all the boarders dark purple, but if my cursor is in a window, make that pane's borders pink.

## Message Style

At the bottom of a tmux window, you'll see the status bar. But this gets covered up by the tmux command line and any messages from tmux.

I kept this similar to the status bar, with a grey background and blue text.

```tmux
# message text
set -g message-style bg='#44475a',fg='#8be9fd'
```

## Status Line

The status line is comprised of three parts. `status-left`, `window-status` and `status-right`. Remember how I said that tmux has multiple windows. You can think of these like tabs in iTerm. All of the `window-status` directives style these tabs.

Lets start with some basic configs.

```tmux
set -g status-style bg='#44475a',fg='#bd93f9'
set -g status-interval 1
```

Here we set the background to a dark grey and the foreground to purple. Although, the purple will get overwritten later.

The next line is important for what we're going to do with `status-right` later. It tells tmux to refresh the status line every second.

All right, now for `status-left`.

```tmux
# status left
# are we controlling tmux or the content of the panes?
set -g status-left '#[bg=#f8f8f2]#[fg=#282a36]#{?client_prefix,#[bg=#ff79c6],} ☺ '
```
The syntax here is getting a little more tricky than when we were styling the status line. The status and window options take a single string as their argument, but you can pass styles in through square brackets and you can call tmux variables inside curly braces. 

So my status left line says, make the background light grey and the foreground dark grey. Then we have a conditional. Has the client prefix key been pressed? If so, lets actually make the background pink, if not, don't do anything. And finally The string ends with ` ☺ `.

This gives me a quick way to see if I've typed the prefix or not. Handy when you're prone to mistyping, or when you get distracted in the middle of switching panes or windows.

Next, I want to add to this status-left string. Passing the `a` option into `set` tells tmux to append this string to the previous one rather than overwrite it. 

```tmux
# are we zoomed into a pane?
set -ga status-left '#[bg=#44475a]#[fg=#ff79c6] #{?window_zoomed_flag, ↕  ,   }'
```

Looks similar to the one above, right. This time, I'm displaying an arrow if I've zoomed one of my panes to take up the whole window. Otherwise, I'm leaving this blank.

Okay! On to to `window-status`.


```tmux
# window status
set-window-option -g window-status-style fg='#bd93f9',bg=default
set-window-option -g window-status-current-style fg='#ff79c6',bg='#282a36'
```

Here I've set the default window status to blend in to the rest of the status bar and the active window to be purple with white text. `window-status-format` is where things get more interesting.

```tmux
set -g window-status-current-format "#[fg=#44475a]#[bg=#bd93f9]#[fg=#f8f8f2]#[bg=#bd93f9] #I #W #[fg=#bd93f9]#[bg=#44475a]"
set -g window-status-format "#[fg=#f8f8f2]#[bg=#44475a]#I #W #[fg=#44475a] "
```

This looks similar to what we have above, but there's some style tricks we need to do. I wanted to have triangular shapes delineating my windows similar to what Vim Powerline does. In order to get the style to work I have to toggle the foreground and background colours before and after the . Then to display the name of the window I'm using `#I`, which is a short-hand for the `window_index` variable and `#W`, which is short for `window_name`

Almost done! `status-right` should look pretty familiar now.

```tmux
# status right
set -g status-right '#[fg=#8be9fd,bg=#44475a]#[fg=#44475a,bg=#8be9fd] #(tmux-mem-cpu-load -g 5 --interval 2) '
set -ga status-right '#[fg=#ff79c6,bg=#8be9fd]#[fg=#44475a,bg=#ff79c6] #(uptime | cut -f 4-5 -d " " | cut -f 1 -d ",") '
set -ga status-right '#[fg=#bd93f9,bg=#ff79c6]#[fg=#f8f8f2,bg=#bd93f9] %a %H:%M:%S #[fg=#6272a4]%Y-%m-%d '
```

The difference here is that I'm using parentheses to tell tmux to execute a bash command. The first one displays a summary of my memory and CPU usage and the second one tells me how long it's been since the last reboot.

## Conclusion

Yay, a Dracula theme!!! I'm still working on perfecting my tmux config. Lots of it is borrowed from other people's dot files, but I'm pretty happy with my Dracula theme. Now I have to do the same form my command prompt!


