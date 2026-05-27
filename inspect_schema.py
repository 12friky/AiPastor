import sqlite3
import os
path = os.path.join(os.getcwd(), 'assets', 'bsb.db')
print('path=' + path)
conn = sqlite3.connect(path)
c = conn.cursor()
print('--- sqlite_master ---')
for row in c.execute("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','view') ORDER BY name"):
    print(row)
print('--- columns ---')
for t in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall():
    table = t[0]
    print('TABLE', table)
    for col in c.execute('PRAGMA table_info("%s")' % table):
        print(col)
conn.close()
