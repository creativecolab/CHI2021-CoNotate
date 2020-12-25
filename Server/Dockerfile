FROM python:3.8.3-buster

WORKDIR /app
COPY requirements.txt /app/

RUN pip install -r requirements.txt
RUN python -m textblob.download_corpora

EXPOSE 8080
COPY . /app/

CMD [ "python", "app.py" ]
