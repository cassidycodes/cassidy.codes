+++
date = "2018-03-22"
title = "How to Rewrite git History when Collaborating with Others"
+++

I was recently working on a new node project, and while I was first testing things out, I committed the contents of the dist directory to git. Later on, I was getting the project set up with Docker, and I realized I didn’t want the dist in the repo as it would increase the size of the Docker image.

Removing files from git is a bit tricky. You can add it to the .gitignore, but once git is tracking an object, git will always follow its changes even if it's in the gitignore. I've kept [Dalibor Nasevic's post](https://dalibornasevic.com/posts/2-permanently-remove-files-and-folders-from-a-git-repository) in my bookmarks for situations like this. But to remove the dist from our project, we needed to rewrite history on multiple branches to be sure that the files here would never show up again

Here are the steps we followed to rewrite history on multiple branches:

Checkout master.

```shell
git checkout master
```

Add `dist/` to the `.gitignore`.

Rewrite history on master to ignore the `dist` directory. Note that this rewrites the SHA of each commit. Your branch will now look like an entirely different set of commits to git.

```shell
git filter-branch --tree-filter 'rm -rf dist' HEAD
```

See if any objects in your repo are pointing to the dist. You should see your branch name in the output here.

```shell
git for-each-ref --format='delete %(refname)' refs/original
```

Dereference the objects by expiring the reflog and forcing GC.

```shell
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now
```

Force push the new master branch.

```shell
git push origin master --force
```

Now other developers will need to follow similar steps to get their branches up to date. They can checkout their working branch and follow steps above, but stop short of pushing their branches. These steps will remove the `dist` directory from history for them, but they will rewrite every SHA in the branch's history, so the new master branch and their branch will look different to git. To fix this, we'll cherry pick their commits onto a new branch.

Use this command to find the range of SHAs you want to cherrypick. If you have more than 50 commits in your branch, you can drop the `-n 50` option. Copy the first and last SHAs of your work.

```shell
git log —pretty=oneline —graph —abbrev-commit -n 50
```

Start with the new history

```shell
git checkout master
```

And branch off of that

```shell
git checkout -b your-branch-new-history
```

And finally cherry-pick your commits onto your new branch

```shell
git cherry-pick <starting sha>..<ending sha>
```

You can now remove your original working branch and push your new work up to GitHub. Once you've fixed all your working branches, you can verify that the `dist` directory is no longer in your history by listing all files ever tracked by git, including deleted ones:

```shell
git log --pretty=format: --name-only --diff-filter=A | sort - | sed '/^$/d' | grep dist
```
