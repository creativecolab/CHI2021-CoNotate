import flask
from flask import Flask, request
# from flask_cors import CORS, cross_origin
import os
import json

from textblob import TextBlob
from textblob import Word

import nltk
nltk.download('brown')
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
from nltk.tokenize import word_tokenize
import nltk.tokenize as nt

import pandas as pd
import numpy as np
import string

import requests

from gensim.models import Word2Vec
from nltk.cluster import KMeansClusterer
from sklearn import cluster
from sklearn import metrics

from collections import Counter
import math

import html
from urllib.parse import unquote

app = Flask(__name__)

@app.route('/', methods=['GET'])
def call_home():
    print("Home Route Hit")
    response = flask.Response("CoNotate - Version 1.0")
    response.headers['Access-Control-Allow-Origin'] = '*'
    return(response)

# search tool plugin

def sent_vectorizer(sent, model):
    sent_vec =[]
    numw = 0
    for w in sent:
        try:
            if numw == 0:
                sent_vec = model[w]
            else:
                sent_vec = np.add(sent_vec, model[w])
            numw+=1
        except:
            pass
    return np.asarray(sent_vec) / numw

def np_detection(corpus):
    #replace - ' to " " at the beginning
    corpus = corpus.translate(str.maketrans('', '', string.punctuation))
    corpus = corpus.translate(str.maketrans('', '', '’\ufeff→'))
    noun_phrase = TextBlob(corpus).noun_phrases
    np_lists = [x.split() for x in noun_phrase if "http" not in x]
    return np_lists

def w2v_topic(np_word_list, number_cluster):
    model = Word2Vec(np_word_list, min_count=1)
    X=[]
    for np_word in np_word_list:
        X.append(sent_vectorizer(np_word, model))

    NUM_CLUSTERS=number_cluster
    kclusterer = KMeansClusterer(NUM_CLUSTERS, avoid_empty_clusters=True, distance=nltk.cluster.util.cosine_distance, repeats=25)
    assigned_clusters = kclusterer.cluster(X, assign_clusters=True)

    column_names = ["cluster", "phrase"]

    df_np = pd.DataFrame(columns = column_names)
    
    for index, sentence in enumerate(np_word_list):    
        new_row = {'cluster': assigned_clusters[index], 'phrase': " ".join(sentence)}
        df_np = df_np.append(new_row, ignore_index=True)

    df_np = df_np.sort_values(by='cluster', ascending=True)
    df_np_group = df_np.groupby(['cluster'])['phrase'].apply(', '.join).reset_index()
    df_np_count = df_np.groupby("cluster").count().reset_index()
    df_np_count = df_np_count.rename(columns={'phrase': 'count'})

    column_names = ["index", "label"]
    df_label = pd.DataFrame(columns = column_names)

    for index, row in df_np_group.iterrows():
        counter_dict = dict(Counter(row['phrase'].split(", ")))
        cluster_label = max(counter_dict, key=counter_dict.get)
        new_row = {'index': index, 'label': cluster_label}
        df_label = df_label.append(new_row, ignore_index=True)

    df_label['index']=df_label['index'].astype(int)
    df_return = pd.merge(df_label, df_np_count, how='left', left_on = 'index', right_on = 'cluster')
    list_return = list(df_return[['label', 'count']].sort_values(by="count", ascending=False)['label'])
    return list_return

def jaccard_similarity(string1, string2):
    list1 = string1.split()
    list2 = string2.split()
    intersection = len(list(set(list1).intersection(list2)))
    union = (len(list1) + len(list2)) - intersection
    return float(intersection) / union

def decode_html_url(html_url_string):
    html_url_string = html.unescape(html_url_string)
    html_url_string = unquote(html_url_string)
    return html_url_string

def cosine_similarity(string_A, string_B):
    counterA = Counter(string_A.split())
    counterB = Counter(string_B.split())
    terms = set(counterA).union(counterB)
    dotprod = sum(counterA.get(k, 0) * counterB.get(k, 0) for k in terms)
    magA = math.sqrt(sum(counterA.get(k, 0)**2 for k in terms))
    magB = math.sqrt(sum(counterB.get(k, 0)**2 for k in terms))
    return dotprod / (magA * magB)

@app.route('/all_in_one_json', methods=['POST'])
def all_in_one_json():
    data = request.get_json(force=True)
    raw_query = data["query"]
    raw_autocomplete = data["autocomplete"]
    raw_note = data["note"]
    raw_serp = data["serp"]

    query = decode_html_url(raw_query)
    autocomplete = decode_html_url(raw_autocomplete)
    note = decode_html_url(raw_note)
    serp = decode_html_url(raw_serp)

    autocomplete_np = [[auto_np] for auto_np in autocomplete.split(", ")]
    note_np = np_detection(note)
    serp_np = np_detection(serp)

    note_only_np = [x for x in note_np if x not in autocomplete_np]
    #remove np in autocomplete and note from serp
    serp_only_np = [x for x in serp_np if x not in autocomplete_np]
    serp_only_np = [x for x in serp_only_np if x not in note_np]

    #not only return a list of nps, but return a dict of np: count
    overview = w2v_topic(note_only_np, 4)
    explore = w2v_topic(serp_only_np, 8)

    #remove those np keys which are similar to query
    overview_final = [np for np in overview if cosine_similarity(query, np) < 0.4]
    explore_final = [np for np in explore if cosine_similarity(query, np) < 0.4]

    return_dict = {} 
    return_dict["overview"] = overview_final[:3]
    return_dict["explore"] = explore_final[:3]

    response = flask.Response(json.dumps(return_dict))
    response.headers['Access-Control-Allow-Origin'] = '*'
    return(response)

# @app.route('/all_in_one_body', methods=['POST'])
# def all_in_one_body():
#     raw_query = request.form.get("query")
#     raw_autocomplete = request.form.get("autocomplete")
#     raw_note = request.form.get("note")
#     raw_serp = request.form.get("serp")

#     query = decode_html_url(raw_query)
#     autocomplete = decode_html_url(raw_autocomplete)
#     note = decode_html_url(raw_note)
#     serp = decode_html_url(raw_serp)

#     autocomplete_np = [[auto_np] for auto_np in autocomplete.split(", ")]
#     note_np = np_detection(note)
#     serp_np = np_detection(serp)

#     note_only_np = [x for x in note_np if x not in autocomplete_np]
#     #remove np in autocomplete and note from serp
#     serp_only_np = [x for x in serp_np if x not in autocomplete_np]
#     serp_only_np = [x for x in serp_only_np if x not in note_np]

#     #not only return a list of nps, but return a dict of np: count
#     overview = w2v_topic(note_only_np, 4)
#     explore = w2v_topic(serp_only_np, 8)

#     #remove those np keys which are similar to query
#     overview_final = [np for np in overview if cosine_similarity(query, np) < 0.4]
#     explore_final = [np for np in explore if cosine_similarity(query, np) < 0.4]

#     return_dict = {} 
#     return_dict["overview"] = overview_final[:3]
#     return_dict["explore"] = explore_final[:3]

#     response = flask.Response(json.dumps(return_dict))
#     response.headers['Access-Control-Allow-Origin'] = '*'
#     return(response)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))