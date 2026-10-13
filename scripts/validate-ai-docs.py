#!/usr/bin/env python3
"""Validate repository AI docs without dependencies; does not inspect secrets."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    'AGENTS.md', 'CLAUDE.md', 'SUB-AGENTS.md', 'Rules/README.md',
    'Rules/global.md', 'Rules/conventions.md', 'Rules/security.md',
    'Rules/documentation.md', 'Rules/validation.md', 'src/AGENTS.md',
    'supabase/AGENTS.md', 'docs/ai/README.md', 'docs/ai/architecture.md',
    'docs/ai/repository-map.md', 'docs/ai/database-contracts.md',
    'docs/ai/domain-contracts.md', 'docs/ai/review.md', 'docs/ai/changes.md',
]
SKILLS = ['courtly-change', 'courtly-database', 'courtly-scheduling',
          'courtly-pagination', 'courtly-ui']


def validate(root):
    errors = []
    for name in REQUIRED:
        if not (root / name).is_file():
            errors.append(f'Missing required document: {name}')
    folder = root / '.agents/skills'
    skills = sorted(folder.glob('*/SKILL.md'))
    for name in SKILLS:
        if not (folder / name / 'SKILL.md').is_file():
            errors.append(f'Missing baseline skill: {name}')
    names = set()
    agent_text = (root / 'AGENTS.md').read_text(encoding='utf-8') if (root / 'AGENTS.md').exists() else ''
    for skill in skills:
        text = skill.read_text(encoding='utf-8')
        if len(text.splitlines()) > 500:
            errors.append(f'{skill.relative_to(root)} exceeds 500 lines')
        match = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)', text, re.S)
        if not match:
            errors.append(f'{skill.relative_to(root)}: missing frontmatter')
            continue
        fields = {}
        for line in match.group(1).splitlines():
            if not line.strip():
                continue
            key, sep, value = line.partition(':')
            if not sep or key.strip() in fields:
                errors.append(f'{skill.relative_to(root)}: malformed or duplicate frontmatter')
                continue
            fields[key.strip()] = value.strip().strip('"\'')
        if set(fields) != {'name', 'description'}:
            errors.append(f'{skill.relative_to(root)}: use only name and description')
        name = fields.get('name', '')
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', name) or len(name) > 64 or name != skill.parent.name:
            errors.append(f'{skill.relative_to(root)}: invalid name')
        if not fields.get('description'):
            errors.append(f'{skill.relative_to(root)}: empty description')
        if name in names:
            errors.append(f'Duplicate skill name: {name}')
        names.add(name)
        if str(skill.relative_to(root)).replace('\\', '/') not in agent_text:
            errors.append(f'{skill.relative_to(root)}: not indexed in AGENTS.md')
        if not (skill.parent / 'agents/openai.yaml').is_file():
            errors.append(f'{skill.relative_to(root)}: missing UI metadata')
        if re.search(r'\bTODO\b|\[TBD\]', text):
            errors.append(f'{skill.relative_to(root)}: unfinished template')
    docs = {root / name for name in REQUIRED if (root / name).exists()}
    for folder_name in ['Rules', 'docs/ai', '.agents/skills']:
        docs.update((root / folder_name).rglob('*.md'))
    for doc in sorted(docs):
        text = doc.read_text(encoding='utf-8')
        # Strip fenced examples so illustrative links are not treated as files.
        text = re.sub(r'```.*?```', '', text, flags=re.S)
        for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', text):
            if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target) or target.startswith('#'):
                continue
            target = target.split('#', 1)[0]
            if target and not (doc.parent / target).exists():
                errors.append(f'{doc.relative_to(root)}: broken link {target}')
    return errors, len(docs), len(skills)


if __name__ == '__main__':
    errors, count, skill_count = validate(ROOT)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        sys.exit(1)
    print(f'OK: {count} documents; {skill_count} skills; all skills <=500 lines.')
    print('Structure validated. Code/doc semantic consistency requires review.')
