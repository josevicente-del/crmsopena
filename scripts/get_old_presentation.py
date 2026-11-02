# -*- coding: utf-8 -*-
import subprocess

out = subprocess.check_output(['git', 'show', 'fb78570:src/App.jsx'], encoding='utf-8')
idx = out.find("{activeTab === 'presentation' && (")
print('Index:', idx)
if idx != -1:
    end_idx = out.find("{activeTab === 'tasks' && (", idx)
    print('Length:', end_idx - idx)
    with open('presentation_body_old.txt', 'w', encoding='utf-8') as f:
        f.write(out[idx:end_idx])
    print('Guardado presentation_body_old.txt')
