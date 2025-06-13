from flask import Flask, render_template

# Flaskアプリケーションのインスタンスを作成
app = Flask(__name__)

# ルートURL ('/') にアクセスがあったときに実行される関数
@app.route('/')
def home():
    # 'templates'フォルダの中の'index.html'をブラウザに返します
    return render_template('index.html')

# このファイルが直接実行された場合に開発用サーバーを起動
if __name__ == '__main__':
    # debug=Trueにすると、コードを変更した際に自動でリロードされるので便利
    app.run(debug=True, host='0.0.0.0')