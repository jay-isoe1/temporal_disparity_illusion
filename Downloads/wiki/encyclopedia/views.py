from django.shortcuts import render, redirect
from django.urls import reverse
from django.http import Http404
from django.contrib import messages
from . import util
import markdown2
import random

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def entry(request, title):
    content = util.get_entry(title)
    if content is None:
        return render(request, "encyclopedia/error.html", {
            "message": f"The page '{title}' was not found."
        }, status=404)

    # Convert Markdown → HTML here
    html = markdown2.markdown(content)

    return render(request, "encyclopedia/entry.html", {
        "title": title,
        "content_html": html
    })


def search(request):
    q = (request.GET.get("q") or "").strip()
    if not q:
        return redirect("encyclopedia:index")

    entries = util.list_entries()

    # Exact match → redirect
    for name in entries:
        if name.lower() == q.lower():
            return redirect("encyclopedia:entry", title=name)

    # Substring matches → results page
    matches = [e for e in entries if q.lower() in e.lower()]
    return render(request, "encyclopedia/search.html", {
        "query": q,
        "results": matches
    })

def new_page(request):
    if request.method == "POST":
        title = (request.POST.get("title") or "").strip()
        content = (request.POST.get("content") or "").strip()

        if not title or not content:
            return render(request, "encyclopedia/new.html", {
                "error": "Both title and content are required.",
                "title_val": title,
                "content_val": content
            })

        # Prevent duplicate (case-insensitive)
        if any(e.lower() == title.lower() for e in util.list_entries()):
            return render(request, "encyclopedia/new.html", {
                "error": "An entry with this title already exists.",
                "title_val": title,
                "content_val": content
            })

        util.save_entry(title, content)
        return redirect("encyclopedia:entry", title=title)

    # GET
    return render(request, "encyclopedia/new.html")

def edit_page(request, title):
    existing = util.get_entry(title)
    if existing is None:
        return render(request, "encyclopedia/error.html", {
            "message": f"The page '{title}' does not exist."
        }, status=404)

    if request.method == "POST":
        content = (request.POST.get("content") or "").strip()
        util.save_entry(title, content)  # overwrites
        return redirect("encyclopedia:entry", title=title)

    # GET → prefill
    return render(request, "encyclopedia/edit.html", {
        "title": title,
        "content_val": existing
    })

def random_page(request):
    entries = util.list_entries()
    if not entries:
        raise Http404("No entries available.")
    title = random.choice(entries)
    return redirect("encyclopedia:entry", title=title)
