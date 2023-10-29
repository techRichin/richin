import numpy as np
import datetime as dt
import pandas as pd
import yfinance as yf
from datetime import date
from sklearn import preprocessing 
from sklearn.preprocessing import MinMaxScaler
import random
import math
from flask import Flask, jsonify, request
import sqlite3
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler
import joblib
import numpy as np
import datetime as dt
import pandas as pd
import yfinance as yf
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
from flask import Flask, request, jsonify
import pickle
from flask_cors import CORS


import json
import openai
import matplotlib.pyplot as plt
import requests
from textblob import TextBlob
from bs4 import BeautifulSoup

portfolio_analysis = {}
ex_rate = 81
years = 7
z = None
user = 'Merken'

df = pd.read_csv(r'final_data7.csv')
cry = pd.read_csv(r'crypto_final1.csv')

def norm(arr):
  return MinMaxScaler().fit_transform(np.array(arr).reshape(-1,1))


features = ['NAME OF COMPANY', 'SYMBOL','marketCap','sector','volitility','std','price', 'Sscore', 'beta', 'cagr','market_cagr', 'net_cagr','returns','sharp_ratio','spearman','pearson', 'kendall','period']
featuresc = ['Sscore', 'Symbol','Market Cap', 'Name','cagr', 'currency', 'marketCap', 'period', 'returns', 'sharp_ratio','std', 'volitility','price']
le = preprocessing.LabelEncoder()
new = df[features].copy().dropna(axis=0, subset=['Sscore'])
new['avgcorr'] = new[['spearman','pearson', 'kendall']].sum(axis='columns')/3
new['intsector'] = le.fit_transform(new['sector'])
new['spscore'] = norm(new['Sscore']*new['period']/new['volitility'])
new['Sscore'] = norm(new['Sscore'])
new['vscore'] = norm(new['Sscore']/new['returns'])
new = new.query(f'period >= {years}')
portfo = None
cry = cry[featuresc]
cry['spscore'] = cry['Sscore']*cry['period']/cry['volitility']
cry['price'] *= ex_rate
xl = 'final_data7.csv'

from tensorflow.keras.models import load_model

# Load the model
loaded_model = load_model('my_cagr_model.h5')
print(joblib.__version__)
scaler = joblib.load('scaler.pkl')
pca = joblib.load('pca.pkl')

df = pd.read_csv(xl)

# 



def minmax_normalize_dict(input_dict):
    if not input_dict:
        return {}

    min_value = min(input_dict.values())
    max_value = max(input_dict.values())

    # Check for division by zero
    if max_value == min_value:
        return {key: 1 for key in input_dict}

    return {key: (value - min_value) / (max_value - min_value) for key, value in input_dict.items()}


def preprocess_new_data(new_data):
    global scaler,pca
    # Extract stock symbols before preprocessing
    symbols = new_data['SYMBOL'].tolist()  # Replace 'SYMBOL' with the actual column name for stock symbols

    # Drop the specified columns
    columns_to_drop = ['market_cagr', 'returns']
    df_cleaned = new_data.drop(columns=columns_to_drop, errors='ignore')

    # Separate numerical and categorical columns
    numerical_cols = df_cleaned.select_dtypes(include=['float64', 'int64']).columns
    categorical_cols = df_cleaned.select_dtypes(include=['object']).columns

    # Fill missing values for numerical columns with their mean
    for col in numerical_cols:
        df_cleaned[col].fillna(df_cleaned[col].mean(), inplace=True)

    # Fill missing values for categorical columns with their mode
    for col in categorical_cols:
        df_cleaned[col].fillna(df_cleaned[col].mode()[0], inplace=True)

    # Identify and replace infinite values
    infinite_cols = [col for col in numerical_cols if np.isinf(df_cleaned[col]).any()]
    df_cleaned[infinite_cols] = df_cleaned[infinite_cols].replace([np.inf, -np.inf], np.nan)
    for col in infinite_cols:
        df_cleaned[col].fillna(df_cleaned[col].mean(), inplace=True)

    # Scale numerical columns
    df_cleaned[numerical_cols] = scaler.transform(df_cleaned[numerical_cols])

    # One-hot encoding for categorical variables
    df_cleaned = pd.get_dummies(df_cleaned)

    # Apply PCA
    X_final = pca.transform(df_cleaned.drop(columns=['cagr'], errors='ignore'))

    return X_final, symbols


new_data_preprocessed, symbols = preprocess_new_data(df)  # Implement this function based on your original preprocessing steps

# Make predictions
predictions = loaded_model.predict(new_data_preprocessed)
predictions_list = predictions.flatten().tolist()

# Create a dictionary mapping stock symbols to predicted CAGR values
symbol_to_prediction = dict(zip(symbols, predictions_list))


def portfolio(row):
  global portfo
  if '.NS' in row['Symbol']:
    row['quantity'] = round(portfo[row['Symbol']]/row['price'])
    row['purchase'] = row['quantity']*row['price']
  else:
    row['purchase'] = portfo[row['Symbol']]
    row['quantity'] = portfo[row['Symbol']]/row['price']
  return row


def final_portfolio(port,amt,risk):
  global portfo,symbol_to_prediction
  data = build(**port)
  tickers = bucket(r = data['r'],risk=risk)
  start = "2015-01-01"
  df = yf.download(tickers, start=start)
  data = df['Adj Close']
  log_returns = np.log(data/data.shift())
  a = new[new['SYMBOL'].isin(tickers)][['SYMBOL','cagr','price','period','std','marketCap']].rename({'SYMBOL': 'Symbol'}, axis='columns')
  b = cry[cry['Symbol'].isin(tickers)][['Symbol','cagr','price','period','std','marketCap']]
  ab = pd.concat([a,b])
  mc = dict(zip(ab['Symbol'],(ab['period']**3)*ab['marketCap']**2))
  for m in mc.keys():
    if '.NS' not in m:
      mc[m] = mc[m]*0.3

  n = 500*len(tickers)
  weights = np.zeros((n, len(tickers)))
  exp_rtns = np.zeros(n)
  exp_vols = np.zeros(n)
  sharpe_ratios = np.zeros(n)
  ai_preds = minmax_normalize_dict(symbol_to_prediction)

  # markcap = []

  markcap = [mc[tick] * ai_preds[tick] if tick in ai_preds.keys() else mc[tick]*0.2 for tick in tickers]


  for i in range(n):
      weight = np.random.random(len(tickers))
      weight /= weight.sum()
      weights[i] = weight

      exp_rtns[i] = np.sum(log_returns.mean()*weight)*252
      exp_vols[i] = np.sqrt(np.dot(weight.T, np.dot(log_returns.cov()*252, weight)))

      sharpe_ratios[i] = (exp_rtns[i] / (exp_vols[i])**2)*sum(weight*(markcap))

  index = np.where((norm(exp_vols).reshape(-1) <= 0.6) & (norm(exp_rtns).reshape(-1) >= 0) & (norm(exp_rtns).reshape(-1) <= 1))[0]
  # import matplotlib.pyplot as plt
  # fig, ax = plt.subplots()
  # ax.scatter(exp_vols, exp_rtns, c=sharpe_ratios)
  # ax.scatter(exp_vols[np.where(sharpe_ratios == sharpe_ratios[index].max())], exp_rtns[np.where(sharpe_ratios == sharpe_ratios[index].max())], c='r')
  # ax.set_xlabel('Expected Volatility')
  # ax.set_ylabel('Expected Return')
  print(index)
  investments = weights[sharpe_ratios[index].argmax()]*amt
  portfo = dict(zip(tickers,investments))
  abc = ab.apply(portfolio,axis=1).drop_duplicates(subset='Symbol')
  abc['cagr'] *= (1 - abc['std']*10)
  abc['exp_cagr'] = abc['cagr'] *(abc['purchase']/abc['purchase'].sum()) *100
  abc['exp_returns'] = abc['cagr'] * abc['purchase']
  abc['percentage'] = (abc['purchase']/abc['purchase'].sum())*100
  return abc

# @app.route('/infostocks', methods=['POST','GET'])
def info_on():
  data = request.json
  msft = yf.Ticker(data['ticker'] + '.NS')
  info = msft.info
  return info

def build(pv=None, fv=None, r=None,n=None):

  if fv == None:
    fv = pv * (((1 + (r/100.0)) ** n))
  elif r == None:
    r = (((fv/pv)**(1/n))-1)*100
  elif n == None:
    n = (np.log(fv/pv))/np.log(1+r/100)
  return ({
      'pv':pv,'fv':fv
      ,'r':r,'n':n})

def bucket(n=15,cryp_split=0.3,r=12,risk=0):
  r /= 100
  rmin = r*(risk/100)
  ncrypto = math.floor(n*cryp_split)
  nstocks = n - ncrypto - 5
  # print(nstocks)
  df = new.query(f'cagr >= {rmin}')
  df1 = cry.query(f'cagr >= {rmin}').drop_duplicates()
  numeric_columns = df.select_dtypes(include=['int', 'float'])
#   print(df.groupby('sector')[numeric_columns.columns].mean())
  inedx = list(df.groupby('sector')[numeric_columns.columns].mean().sort_values(by=['spscore'],ascending=False).index)
  sectors, cryp = inedx[:5] , []
  # sectors.append('RELIANCE.NS')
  bucket = ['RELIANCE.NS']

  for x in range(nstocks):
    sectors.append(random.choice(inedx))

  for x in range(ncrypto):
    bucket.append(random.choice(list(cry.sort_values(by=['spscore'],ascending=False)['Symbol'].head(ncrypto*3))))

  for sec in sectors:
    #  print(df.loc[df['sector'] == sec].sort_values(by=['spscore'],ascending=False))
     candidates = list(df.loc[df['sector'] == sec].sort_values(by=['spscore'],ascending=False)['SYMBOL'].head(5))

    #  print(candidates)
     bucket.append(random.choice(candidates))

  return list(set(bucket))

app = Flask(__name__)
CORS(app)
app.config["DEBUG"] = True

@app.route('/get_portfolio', methods=['POST','GET'])  ##api endppoint
def get_data():
    data=request.json
    global abc,portfolio_analysis
    global z
    # Retrieve the data from the request
    # print('executed')
    # data = request.json
    print(data)
    
    obj = {}
    obj["pv"] = data["pv"]
    obj["fv"] = data["fv"]
    obj["r"] = data["r"]
    obj["n"] = data["n"]

    print(obj)
    

    data1=[obj,obj["pv"],data["risk"]]                      # amount value same as present value

    port, amt, risk = build(**data1[0]), data1[1], data1[2]
    print(port)

    # Process the data or perform any required calculations
    abc = final_portfolio(port, amt,risk)
    abc.drop(['period','std'], axis=1,inplace=True)

    portfolio_analysis = {
        'crypto_percentage': abc[abc['Symbol'].str.contains('USD', regex=True, na=False)]['percentage'].sum(),
        'stocks_percentage': abc[abc['Symbol'].str.contains('.NS', regex=True, na=False)]['percentage'].sum(),
        'stocks_expected_return': abc[abc['Symbol'].str.contains('.NS', regex=True, na=False)]['exp_cagr'].sum(),
        'crypto_expected_return': abc[abc['Symbol'].str.contains('USD', regex=True, na=False)]['exp_cagr'].sum(),
        'total_expected_return': abc['exp_cagr'].sum(),
        'total_purchase': abc['purchase'].sum()
    }

    new_port = build(fv=port['fv'],r=portfolio_analysis['total_expected_return'],pv=portfolio_analysis['total_purchase']
                     ,n=None)
    portfolio_analysis['future_value'] = new_port['fv']
    portfolio_analysis['years'] = new_port['n']
    print(abc)
    print(portfolio_analysis)
    z = abc[['Symbol','quantity']]
    # insert_purchase_order(z)
    # Return the processed data as a JSON response
    stocks = abc[abc['Symbol'].str.contains('.NS', regex=True, na=False)].to_json(orient = 'records')
    crypto = abc[abc['Symbol'].str.contains('USD', regex=True, na=False)].to_json(orient = 'records')
    print(crypto)
    return jsonify(abc.to_json(orient = 'records'), portfolio_analysis,stocks,crypto)



# stock details 
@app.route('/get_stock_data', methods=['GET'])
def get_stock_data():
    symbol = request.args.get('symbol')
    
    if not symbol:
        return jsonify({'error': 'No symbol provided'})

    try:

        stock = yf.Ticker(symbol)
        data = stock.history(period="1d")

        if not data.empty:
            latest_data = data.iloc[-1]
            timestamp = latest_data.name
            price = latest_data['Close']
            volume = latest_data['Volume']

            response_data = {
                'symbol': symbol,
                'price': price,
                'volume': volume,
            }

            return jsonify(response_data)
        else:
            response_data = {
                    'symbol': "",
                    'price': 0,
                    'volume': 0,
            }
            
            return jsonify(response_data)
    except Exception as e:
        return jsonify({'error': f'Error: {e}'})        
                
# stock_financial_data
# stock details 
@app.route('/get_stock_financial_data', methods=['GET'])
def get_stock_data_meta():
    symbol_f = request.args.get('symbol')
    
    if not symbol_f:
        return jsonify({'error': 'No symbol provided'})

    try:
        ticker = yf.Ticker(symbol_f)
        stock_info = ticker.info

        if not stock_info.empty:
            # stock_Symbol = stock_info['symbol']
            # last_price = stock_info['last_price']
            # day_range = stock_info['day_range']
            # day_low = stock_info['day_low']
            # day_high = stock_info['day_high']
            # previous_close = stock_info['previous_close']
            # volume = stock_info['volume']
            # Extracting more attributes from stock_info
            company_name = stock_info['longName']
            sector = stock_info['sector']
            market_cap = stock_info['marketCap']
            open_price = stock_info['regularMarketOpen']
            close_price = stock_info['regularMarketPreviousClose']
            change = close_price - open_price  # Change is the difference between open and close prices
            fundamentals = stock_info['fundamentals']
            total_buy_quantity = fundamentals['totalBuyQuantity']
            total_sell_quantity = fundamentals['totalSellQuantity']
            total_traded_volume = stock_info['regularMarketVolume']
            lower_circuit = fundamentals['lowerCircuitPrice']
            upper_circuit = fundamentals['upperCircuitPrice']
            face_value = fundamentals['faceValue']
            daily_high = stock_info['regularMarketDayHigh']
            daily_low = stock_info['regularMarketDayLow']
            weekly_high = fundamentals['weekHigh52']
            weekly_low = fundamentals['weekLow52']


            response_data_f = {
                'companyName': company_name,
                'sector': sector,
                'marketCap': market_cap,
                'openPrice': open_price,
                'closePrice': close_price,
                'change': change,
                'totalBuyQuantity': total_buy_quantity,
                'totaSellQuantity': total_sell_quantity,
                'totalTradedVolume': total_traded_volume,
                'lowerCircuit': lower_circuit,
                'upperCircuit': upper_circuit,
                'faceValue': face_value,
                'dailylow': daily_low,
                'dailyHigh':daily_high,
                'weeklyHigh': weekly_high,
                'weeklylow': weekly_low
            }

            return jsonify(response_data_f)
        else:
            response_data_f = {
                'companyName': 0,
                'sector': 0,
                'marketCap': 0,
                'openPrice': 0,
                'closePrice': 0,
                'change': 0,
                'totalBuyQuantity': 0,
                'totaSellQuantity': 0,
                'totalTradedVolume': 0,
                'lowerCircuit': 0,
                'upperCircuit': 0,
                'faceValue': 0,
                'dailylow': 0,
                'weeklyHigh': 0,
                'weeklylow': 0
            }
            
            return jsonify(response_data_f)
    except Exception as e:
        return jsonify({'error': f'Error: {e}'})        
 
#  chat part

openai.api_key=open('API_KEY','r').read()

def get_stock_price(company):
    company=company+'.NS'
    dfdata = yf.Ticker(company).history(period='1y')
    return str(dfdata['Close'].iloc[-1])

def stock_info(company):
    company=company+'.NS'
    data = yf.Ticker(company).info
    return str(data)


def calculate_SMA(company,window):
    company=company+'.NS'
    df = yf.Ticker(company).history(period='1y')
    df['SMA'] = df['Close'].rolling(window=window).mean()
    return str(df['SMA'].iloc[-1])

def calculate_EMA(company,window):
    company=company+'.NS'
    df = yf.Ticker(company).history(period='1y')
    df['EMA'] = df['Close'].ewm(span=window,adjust=False).mean()
    return str(df['EMA'].iloc[-1])

def calculate_MACD(company):
    company=company+'.NS'
    df = yf.Ticker(company).history(period='1y').Close
    short_ema = df.ewm(span=12,adjust=False).mean()
    long_ema = df.ewm(span=26,adjust=False).mean()
    MACD=short_ema-long_ema 
    signal = MACD.ewm(span=9,adjust=False).mean()
    MACD_hist = MACD - signal
    return f'{MACD[-1]},{signal[-1]},{MACD_hist[-1]}'


def calculate_RSI(company):
    company=company+'.NS'
    data = yf.Ticker(company).history(period='1y')
    delta = data['Close'].diff(1)
    up=delta.clip(lower=0)
    down=delta.clip(upper=0).abs()
    ema_up=up.ewm(com=13,adjust=False).mean()
    ema_down=down.ewm(com=13,adjust=False).mean()
    rs=ema_up/ema_down
    rsi=100-(100/(1+rs))
    return str(rsi.iloc[-1])

def plot_stock_price(company):
    company=company+'.NS'
    dfdata = yf.Ticker(company).history(period='1y')
    plt.figure(figsize=(12, 6))
    dfdata['Close'].plot(color='blue', linewidth=2)
    plt.title(f"Stock Price for {company}")
    plt.xlabel('Date')
    plt.ylabel('Price (INR)')
    plt.grid(True, alpha=0.3)

    # Adding a legend
    plt.legend([f'{company} Stock Price'])

    # Adding a background color
    plt.axhspan(0, dfdata['Close'].max(), facecolor='0.95')

    # Adding annotations
    max_price_date = dfdata['Close'].idxmax()
    max_price = dfdata['Close'].max()
    plt.annotate(f'Max Price: {max_price:.2f} INR\nDate: {max_price_date.date()}',
                 xy=(max_price_date, max_price),
                 xytext=(max_price_date - pd.DateOffset(months=2), max_price * 0.9),
                 arrowprops=dict(facecolor='black', arrowstyle='wedge,tail_width=0.7'),
                 fontsize=10,
                 color='black')

    plt.tight_layout()

    # Save the plot as an image
    image_path = 'stock_price.png'
    plt.savefig(image_path)
    plt.close()

    return image_path

    
def get_news_articles(stock_ticker):
    sources = [
        ("https://www.moneycontrol.com/news/business/stocks/", "moneycontrol"),
        ("https://www.bloomberg.com/quote/" + stock_ticker + ":IN", "bloomberg"),
        ("https://www.reuters.com/finance/stocks/overview/" + stock_ticker, "reuters"),
        ("https://www.cnbc.com/quotes/" + stock_ticker, "cnbc")
    ]
    
    all_news_data = []
    
    for source, source_type in sources:
        response = requests.get(source)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, "html.parser")
            
            if source_type == "moneycontrol":
                articles = soup.find_all("li", class_="clearfix")
            elif source_type == "bloomberg":
                articles = soup.find_all("div", class_="story-story-grid-story__3MlKt")
            elif source_type == "reuters":
                articles = soup.find_all("div", class_="topStory")
            elif source_type == "cnbc":
                articles = soup.find_all("div", class_="QuotePage-summary")
            
            for article in articles:
                text = article.get_text() if source_type == "moneycontrol" else article.find("h1").get_text()
                all_news_data.append({"source": source_type, "headline": text})
    
    return all_news_data

def analyze_sentiment(text):
    blob = TextBlob(text)
    sentiment = blob.sentiment.polarity
    return sentiment

def get_final_sentiment(sentiments):
    positive_count = sum(1 for sentiment in sentiments if sentiment > 0)
    negative_count = sum(1 for sentiment in sentiments if sentiment < 0)
    
    if positive_count > negative_count:
        return "Positive"
    elif negative_count > positive_count:
        return "Negative"
    else:
        return "Neutral"
def get_stock_sentiment(stock_ticker):
    news_data = get_news_articles(stock_ticker)
    
    if news_data:
        sentiments = [analyze_sentiment(news["headline"]) for news in news_data]
        final_sentiment = get_final_sentiment(sentiments)
        
        result = {
            "ticker": stock_ticker,
            "sentiment": final_sentiment,
            "news": [{"source": news['source'], "headline": news['headline']} for news in news_data]
        }
    else:
        result = {"error": "Error fetching news articles."}

    return result

def sentiment_of_stock(company):
    stock_ticker = company  # Assuming the user provides a stock ticker as input
    sentiment_result = get_stock_sentiment(stock_ticker)
    
    response = f"Sentiment for {sentiment_result['ticker']}: {sentiment_result['sentiment']}\n"
    for news in sentiment_result.get('news', []):
        response += f"Source: {news['source']}\n"
        response += f"Headline: {news['headline']}\n"
        response += f"Sentiment: {analyze_sentiment(news['headline'])}\n"
        response += "-" * 50 + "\n"
    
    return response
    


functions=[
    
    {
        'name':'get_stock_price',
        'description':'Get the current stock price of a company',
        'parameters':{
            'type':'object',
            'properties':{
                'company':{
                    'type':'string',
                    'description':'The company to get the stock price of'
                }
            },
            'required':['company']
        }
    },
    {
        'name':'stock_info',
        'description':'Get the stock info of a company',
        'parameters':{
            'type':'object',
            'properties':{
                'company':{
                    'type':'string',
                    'description':'The company to get the stock info of'
                }
            },
            'required':['company']
        }
    },
    {
        'name':'calculate_SMA',
        'description':'Calculate the Simple Moving Average of a company',
        'parameters':{
            'type':'object',
            'properties':{
                'company':{
                    'type':'string',
                    'description':'The company to calculate the SMA of'
                },
                'window':{
                    'type':'integer',
                    'description':'The window to calculate the SMA over'
                }
            },
            'required':['company','window']
        }
    },
    {
        'name':'calculate_EMA',
        'description':'Calculate the Exponential Moving Average of a company',
        'parameters':{
            'type':'object',
            'properties':{
                'company':{
                    'type':'string',
                    'description':'The company to calculate the EMA of'
                },
                'window':{
                    'type':'integer',
                    'description':'The window to calculate the EMA over'
                }
            },
            'required':['company','window']
        }
    },
    {
        'name':'calculate_MACD',
        'description':'Calculate the Moving Average Convergence Divergence of a company',
        'parameters':{
            'type':'object',
            'properties':{
                'company':{
                    'type':'string',
                    'description':'The company to calculate the MACD of'
                }
            },
            'required':['company']
        }
    },
    {
        'name':'calculate_RSI',
        'description':'Calculate the Relative Strength Index of a company',
        'parameters':{
            'type':'object',
            'properties':{
                'company':{
                    'type':'string',
                    'description':'The company to calculate the RSI of'
                },
                
            },
            'required':['company']
        }
    },
    {
        'name':'plot_stock_price',
        'description':'Plot the stock price of a company over the last year',
        'parameters':{
            'type':'object',
            'properties':{
                'company':{
                    'type':'string',
                    'description':'The company to plot the stock price of'
                }
            },
            'required':['company']
        }
    },
    {
        'name':'sentiment_of_stock',
        'description':'Get the sentiment of a stock',
        'parameters':{
            'type':'object',
            'properties':{
                'company':{
                    'type':'string',
                    'description':'The company to get the sentiment of'
                }
            },
            'required':['company']
        }
    }
    

]

available_functions = {
    'get_stock_price':get_stock_price,
    'stock_info':stock_info,
    'calculate_SMA':calculate_SMA,
    'calculate_EMA':calculate_EMA,
    'calculate_MACD':calculate_MACD,
    'calculate_RSI':calculate_RSI,
    'plot_stock_price':plot_stock_price,
    'sentiment_of_stock':sentiment_of_stock

}



# Initialize session state
session_state = {'messages': []}

# This endpoint will be used by the frontend to send user input to the backend
@app.route('/gpt', methods=['POST'])
def financial_advisor():
    try:
        user_input = request.json.get('user_input')
        
        if user_input:
            session_state['messages'].append({'role': 'user', 'content': user_input})
            response = openai.ChatCompletion.create(
                model='gpt-3.5-turbo-16k',
                messages=session_state['messages'],
                max_tokens=2000,
                functions=functions,
                function_call='auto',

            )
            
            response_message = response['choices'][0]['message']
            # Handle the response as in your original code
            if response_message.get('function_call'):
                args_dict={}
                function_name=response_message['function_call']['name']
                function_args=json.loads(response_message['function_call']['arguments'])
                if function_name in ['get_stock_price','calculate_MACD','calculate_RSI','plot_stock_price','stock_info','sentiment_of_stock']:
                    args_dict={'company':function_args.get('company')}
                elif function_name in ['calculate_SMA','calculate_EMA']:
                    args_dict={'company':function_args.get('company'),'window':function_args.get('window')}
                
                function_to_call=available_functions[function_name]
                function_response=function_to_call(**args_dict)
                # if function_name=='plot_stock_price':
                #     return stock_price.png
                # else:
                session_state['messages'].append(response_message)
                session_state['messages'].append({'role':'function',
                    'name':function_name,'content':function_response})
                
                second_response = openai.ChatCompletion.create(
                    model='gpt-3.5-turbo-16k',
                    messages=session_state['messages'],
                    max_tokens=2000,
                    
                )
                second_response = second_response['choices'][0]['message']
            
                return jsonify({'response': second_response['content']})
            else:
                session_state['messages'].append(response_message)
                return jsonify({'response': response_message['content']})
        else:
            return jsonify({'response': "No user input provided."})
    except Exception as e:
        print("An error occurred:", e)
        return jsonify({'response': "An error occurred."})

if __name__ == '__main__':
    while True:
        try:
            app.run(host='0.0.0.0',debug=True,port=8000)
        except Exception as e:
            print("Error occurred:", e)
            print("Try different prompt or try something different...")

# @app.route('/table', methods=['POST','GET'])
# def get_abc():
#    global abc,portfolio_analysis
#    stocks = abc[abc['Symbol'].str.contains('.NS', regex=True, na=False)].to_json(orient = 'records')
#    crypto = abc[abc['Symbol'].str.contains('USD', regex=True, na=False)].to_json(orient = 'records')
#   #  for x in [stocks,crypto]:
#   #       analysis = {
#   #       'crypto_percentage': abc[abc['Symbol'].str.contains('USD', regex=True, na=False)]['percentage'].sum(),
#   #       'stocks_percentage': abc[abc['Symbol'].str.contains('.NS', regex=True, na=False)]['percentage'].sum(),
#   #       'stocks_expected_return': abc[abc['Symbol'].str.contains('.NS', regex=True, na=False)]['exp_cagr'].sum(),
#   #       'crypto_expected_return': abc[abc['Symbol'].str.contains('USD', regex=True, na=False)]['exp_cagr'].sum(),
#   #       'total_expected_return': abc['exp_cagr'].sum(),
#   #       'total_purchase': abc['purchase'].sum()
#   #   }
#    return [abc.to_json(orient = 'records'), portfolio_analysis,stocks,crypto]




