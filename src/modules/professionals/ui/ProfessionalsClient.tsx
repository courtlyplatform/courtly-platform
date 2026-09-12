'use client';

import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import { useI18n } from '@/shared/i18n/I18nProvider';
import { CourtlyAlert } from '@/shared/ui/CourtlyAlert';

import type {
  Professional,
  ProfessionalPageData,
  ProfessionalSpecialty,
  ProfessionalSpecialtyArea,
} from '../domain/professional';

import {
  inviteProfessionalAction,
  reassignFutureAppointmentsAction,
  saveProfessionalAccessAction,
  saveProfessionalAction,
  saveSpecialtyAction,
  setProfessionalStatusAction,
  setSpecialtyStatusAction,
} from '../application/professional-actions';

import { ProfessionalAvatarEditor } from './ProfessionalAvatarEditor';

import styles from './professionals.module.css';

type Tab = 'professionals' | 'specialties';

type Modal =
  | 'form'
  | 'details'
  | 'access'
  | 'deactivate'
  | 'specialty'
  | null;

type RegistrationDraft = {
  authority: string;
  registrationNumber: string;
  region: string;
};

type AvailabilityDraft = {
  key: string;
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type SpecialtyDraft = {
  id: string;
  name: string;
  area: ProfessionalSpecialtyArea;
  color: string;
};

const specialtyAreas: ProfessionalSpecialtyArea[] = [
  'HEALTHCARE',
  'DENTISTRY',
  'FITNESS',
  'SPORTS',
  'THERAPY',
  'BEAUTY',
  'WELLNESS',
  'EDUCATION',
  'OTHER',
];

const makeAvailability = (
  weekday: number,
  startTime = '08:00',
  endTime = '18:00',
  enabled = false,
): AvailabilityDraft => ({
  key: `${weekday}-${startTime}-${endTime}-${Math.random()
    .toString(36)
    .slice(2)}`,
  weekday,
  enabled,
  startTime,
  endTime,
});

const defaultAvailability = (): AvailabilityDraft[] =>
  Array.from({ length: 7 }, (_, weekday) =>
    makeAvailability(
      weekday,
      '08:00',
      '18:00',
      weekday > 0 && weekday < 6,
    ),
  );

const emptyForm = () => ({
  id: '',
  firstName: '',
  lastName: '',
  preferredName: '',
  jobTitle: '',
  email: '',
  phone: '',
  birthDate: '',
  countryCode: 'BR',
  documentType: '',
  documentNumber: '',
  notes: '',

  specialtyIds: [] as string[],
  activityIds: [] as string[],

  registrations: [
    {
      authority: '',
      registrationNumber: '',
      region: '',
    },
  ] as RegistrationDraft[],

  availabilityRules: defaultAvailability(),
});

const emptySpecialty = (): SpecialtyDraft => ({
  id: '',
  name: '',
  area: 'OTHER',
  color: '#46B99A',
});

const norm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const digits = (value: string) => value.replace(/\D/g, '');

export function ProfessionalsClient({
  initialData,
}: {
  initialData: ProfessionalPageData;
}) {
  const { dictionary } = useI18n();

  const t = dictionary.professionals;

  const router = useRouter();

  const [pending, startTransition] = useTransition();

  const [tab, setTab] = useState<Tab>('professionals');

  const [modal, setModal] = useState<Modal>(null);

  const [selected, setSelected] = useState<Professional | null>(null);

  const [form, setForm] = useState(emptyForm());

  const [specialtyForm, setSpecialtyForm] =
    useState<SpecialtyDraft>(emptySpecialty());

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [regAuthority, setRegAuthority] = useState('');
  const [regNumber, setRegNumber] = useState('');

  const [specialtySearch, setSpecialtySearch] = useState('');
  const [specialtyArea, setSpecialtyArea] = useState('');
  const [specialtyStatus, setSpecialtyStatus] = useState('');

  const [replacementId, setReplacementId] = useState('');

  const [role, setRole] = useState<'ADMIN' | 'PROFESSIONAL'>(
    'PROFESSIONAL',
  );

  const [inviteEmail, setInviteEmail] = useState('');

  const [permissionOverrides, setPermissionOverrides] = useState<
    Record<string, boolean>
  >({});

  /*
   * ============================================================
   * PROFESSIONALS FILTER
   * ============================================================
   */
  const filtered = useMemo(
    () =>
      initialData.professionals.filter((professional) => {
        const haystack = norm(
          [
            professional.fullName,
            professional.preferredName,
            professional.documentNumber,
            professional.registrations
              .map(
                (registration) =>
                  `${registration.authority} ${registration.registrationNumber}`,
              )
              .join(' '),
          ]
            .filter(Boolean)
            .join(' '),
        );

        return (
          (!search || haystack.includes(norm(search))) &&
          (!status ||
            (status === 'ACTIVE'
              ? professional.active
              : !professional.active)) &&
          (!specialty ||
            professional.specialties.some(
              (item) => item.id === specialty,
            )) &&
          (!docType || professional.documentType === docType) &&
          (!docNumber ||
            digits(professional.documentNumber ?? '').includes(
              digits(docNumber),
            )) &&
          (!regAuthority ||
            professional.registrations.some(
              (registration) =>
                registration.authority === regAuthority,
            )) &&
          (!regNumber ||
            professional.registrations.some((registration) =>
              norm(registration.registrationNumber).includes(
                norm(regNumber),
              ),
            ))
        );
      }),
    [
      initialData.professionals,
      search,
      status,
      specialty,
      docType,
      docNumber,
      regAuthority,
      regNumber,
    ],
  );

  /*
   * ============================================================
   * SPECIALTIES FILTER
   *
   * Regra:
   *
   * Tennis
   * => se existir exatamente "Tennis",
   *    retorna somente "Tennis".
   *
   * Tenn
   * => como não existe "Tenn" exato,
   *    retorna "Tennis" e "Beach Tennis".
   * ============================================================
   */
  const filteredSpecialties = useMemo(() => {
    const query = norm(specialtySearch);

    /*
     * Primeiro aplicamos os outros filtros.
     */
    const candidates = initialData.specialties.filter(
      (specialtyItem) =>
        (!specialtyArea ||
          specialtyItem.area === specialtyArea) &&
        (!specialtyStatus ||
          (specialtyStatus === 'ACTIVE'
            ? specialtyItem.active
            : !specialtyItem.active)),
    );

    /*
     * Sem texto digitado, retorna todos os candidatos.
     */
    if (!query) {
      return candidates;
    }

    /*
     * Primeiro procuramos correspondência EXATA.
     */
    const exactMatches = candidates.filter(
      (specialtyItem) =>
        norm(specialtyItem.name) === query,
    );

    /*
     * Se existir uma especialidade com aquele nome exato,
     * ela tem prioridade sobre qualquer correspondência parcial.
     */
    if (exactMatches.length > 0) {
      return exactMatches;
    }

    /*
     * Caso contrário, utiliza correspondência parcial.
     */
    return candidates.filter((specialtyItem) =>
      norm(specialtyItem.name).includes(query),
    );
  }, [
    initialData.specialties,
    specialtySearch,
    specialtyArea,
    specialtyStatus,
  ]);

  const allAuthorities = Array.from(
    new Set(
      initialData.professionals.flatMap((professional) =>
        professional.registrations.map(
          (registration) => registration.authority,
        ),
      ),
    ),
  ).sort();

  const age = (birthDate: string | null) => {
    if (!birthDate) {
      return null;
    }

    const birth = new Date(`${birthDate}T00:00:00`);
    const now = new Date();

    let currentAge =
      now.getFullYear() - birth.getFullYear();

    if (
      now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() &&
        now.getDate() < birth.getDate())
    ) {
      currentAge -= 1;
    }

    return currentAge;
  };

  const openNew = () => {
    setSelected(null);
    setForm(emptyForm());
    setModal('form');
  };

  const openEdit = (professional: Professional) => {
    setSelected(professional);

    const rules: AvailabilityDraft[] = [];

    for (let weekday = 0; weekday < 7; weekday += 1) {
      const dayRules =
        professional.availabilityRules.filter(
          (rule) =>
            rule.weekday === weekday &&
            rule.active,
        );

      if (dayRules.length) {
        dayRules.forEach((rule) => {
          rules.push(
            makeAvailability(
              weekday,
              String(rule.startTime).slice(0, 5),
              String(rule.endTime).slice(0, 5),
              true,
            ),
          );
        });
      } else {
        rules.push(
          makeAvailability(
            weekday,
            '08:00',
            '18:00',
            false,
          ),
        );
      }
    }

    setForm({
      id: professional.id,
      firstName: professional.firstName,
      lastName: professional.lastName,
      preferredName:
        professional.preferredName ?? '',
      jobTitle: professional.jobTitle ?? '',
      email: professional.email ?? '',
      phone: professional.phone ?? '',
      birthDate: professional.birthDate ?? '',
      countryCode:
        professional.countryCode ?? 'BR',
      documentType:
        professional.documentType ?? '',
      documentNumber:
        professional.documentNumber ?? '',
      notes: professional.notes ?? '',

      specialtyIds: professional.specialties.map(
        (item) => item.id,
      ),

      activityIds: professional.activityIds,

      registrations:
        professional.registrations.length
          ? professional.registrations.map(
              (registration) => ({
                authority:
                  registration.authority,
                registrationNumber:
                  registration.registrationNumber,
                region:
                  registration.region ?? '',
              }),
            )
          : [
              {
                authority: '',
                registrationNumber: '',
                region: '',
              },
            ],

      availabilityRules: rules,
    });

    setModal('form');
  };

  const openSpecialty = (
    specialtyItem?: ProfessionalSpecialty,
  ) => {
    setSpecialtyForm(
      specialtyItem
        ? {
            id: specialtyItem.id,
            name: specialtyItem.name,
            area: specialtyItem.area,
            color: specialtyItem.color,
          }
        : emptySpecialty(),
    );

    setModal('specialty');
  };

  function submit(event: FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      const result =
        await saveProfessionalAction(form);

      if (!result.success) {
        setFeedback({
          type: 'error',
          message:
            result.error === 'invalidAvailability'
              ? t.feedback.invalidAvailability
              : t.feedback.saveFailed,
        });

        return;
      }

      setModal(null);

      setFeedback({
        type: 'success',
        message: t.feedback.saved,
      });

      router.refresh();
    });
  }

  function submitSpecialty(event: FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      const result =
        await saveSpecialtyAction({
          id: specialtyForm.id || undefined,
          name: specialtyForm.name,
          area: specialtyForm.area,
          color: specialtyForm.color,
        });

      if (!result.success) {
        setFeedback({
          type: 'error',
          message:
            result.error === 'duplicateSpecialty'
              ? t.specialties.feedback.duplicate
              : t.specialties.feedback.saveFailed,
        });

        return;
      }

      setModal(null);

      setFeedback({
        type: 'success',
        message:
          t.specialties.feedback.saved,
      });

      router.refresh();
    });
  }

  async function confirmDisable() {
    if (!selected) {
      return;
    }

    const result =
      await setProfessionalStatusAction(
        selected.id,
        false,
      );

    if (!result.success) {
      setFeedback({
        type: 'error',
        message: t.feedback.statusFailed,
      });

      return;
    }

    const future = Number(
      result.data?.futureAppointments ?? 0,
    );

    setFeedback({
      type: 'success',
      message: future
        ? t.feedback.disabledWithAppointments.replace(
            '{count}',
            String(future),
          )
        : t.feedback.disabled,
    });

    setModal(null);

    router.refresh();
  }

  const addInterval = (weekday: number) => {
    setForm((current) => ({
      ...current,

      availabilityRules: [
        ...current.availabilityRules,

        makeAvailability(
          weekday,
          '14:00',
          '18:00',
          true,
        ),
      ].sort(
        (a, b) =>
          a.weekday - b.weekday ||
          a.startTime.localeCompare(
            b.startTime,
          ),
      ),
    }));
  };

  const updateInterval = (
    key: string,
    patch: Partial<AvailabilityDraft>,
  ) => {
    setForm((current) => ({
      ...current,

      availabilityRules:
        current.availabilityRules.map(
          (rule) =>
            rule.key === key
              ? {
                  ...rule,
                  ...patch,
                }
              : rule,
        ),
    }));
  };

  const removeInterval = (
    key: string,
    weekday: number,
  ) => {
    setForm((current) => {
      const remaining =
        current.availabilityRules.filter(
          (rule) => rule.key !== key,
        );

      return {
        ...current,

        availabilityRules:
          remaining.some(
            (rule) =>
              rule.weekday === weekday,
          )
            ? remaining
            : [
                ...remaining,

                makeAvailability(
                  weekday,
                  '08:00',
                  '18:00',
                  false,
                ),
              ].sort(
                (a, b) =>
                  a.weekday - b.weekday,
              ),
      };
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>{t.eyebrow}</span>

          <h1>{t.title}</h1>

          <p>{t.description}</p>
        </div>

        {tab === 'professionals' &&
          initialData.canCreate && (
            <button
              className={styles.primary}
              onClick={openNew}
            >
              {t.actions.new}
            </button>
          )}

        {tab === 'specialties' &&
          initialData.canEdit && (
            <button
              className={styles.primary}
              onClick={() =>
                openSpecialty()
              }
            >
              {t.specialties.actions.new}
            </button>
          )}
      </header>

      <nav
        className={styles.tabs}
        aria-label={t.tabs.label}
      >
        <button
          className={
            tab === 'professionals'
              ? styles.tabActive
              : ''
          }
          onClick={() =>
            setTab('professionals')
          }
        >
          {t.tabs.professionals}
        </button>

        <button
          className={
            tab === 'specialties'
              ? styles.tabActive
              : ''
          }
          onClick={() =>
            setTab('specialties')
          }
        >
          {t.tabs.specialties}
        </button>
      </nav>

      {feedback && (
        <CourtlyAlert
          type={feedback.type}
          message={feedback.message}
        />
      )}

      {tab === 'professionals' && (
        <>
          <section className={styles.filters}>
            <label>
              <span>{t.filters.search}</span>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder={
                  t.filters.searchPlaceholder
                }
              />
            </label>

            <label>
              <span>{t.filters.status}</span>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  {t.filters.all}
                </option>

                <option value="ACTIVE">
                  {t.status.active}
                </option>

                <option value="INACTIVE">
                  {t.status.inactive}
                </option>
              </select>
            </label>

            <label>
              <span>
                {t.filters.specialty}
              </span>

              <select
                value={specialty}
                onChange={(event) =>
                  setSpecialty(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  {t.filters.all}
                </option>

                {initialData.specialties
                  .filter(
                    (item) =>
                      item.active,
                  )
                  .map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              <span>
                {t.fields.documentType}
              </span>

              <select
                value={docType}
                onChange={(event) =>
                  setDocType(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  {t.filters.all}
                </option>

                <option>
                  CPF
                </option>

                <option>
                  PASSPORT
                </option>

                <option>
                  OTHER
                </option>
              </select>
            </label>

            <label>
              <span>
                {t.fields.documentNumber}
              </span>

              <input
                value={docNumber}
                onChange={(event) =>
                  setDocNumber(
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              <span>
                {
                  t.filters
                    .registrationAuthority
                }
              </span>

              <select
                value={regAuthority}
                onChange={(event) =>
                  setRegAuthority(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  {t.filters.all}
                </option>

                {allAuthorities.map(
                  (authority) => (
                    <option
                      key={authority}
                    >
                      {authority}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                {
                  t.filters
                    .registrationNumber
                }
              </span>

              <input
                value={regNumber}
                onChange={(event) =>
                  setRegNumber(
                    event.target.value,
                  )
                }
              />
            </label>

            <button
              className={styles.clear}
              onClick={() => {
                setSearch('');
                setStatus('');
                setSpecialty('');
                setDocType('');
                setDocNumber('');
                setRegAuthority('');
                setRegNumber('');
              }}
            >
              {t.filters.clear}
            </button>
          </section>

          <div className={styles.summary}>
            <strong>
              {t.summary.all}:{' '}
              {
                initialData
                  .professionals.length
              }
            </strong>

            <span>
              {t.summary.active}:{' '}
              {
                initialData.professionals.filter(
                  (item) =>
                    item.active,
                ).length
              }
            </span>

            <span>
              {t.summary.inactive}:{' '}
              {
                initialData.professionals.filter(
                  (item) =>
                    !item.active,
                ).length
              }
            </span>
          </div>

          <section className={styles.list}>
            <div
              className={
                styles.listHead
              }
            >
              <span>
                {t.list.professional}
              </span>

              <span>
                {t.list.specialty}
              </span>

              <span>
                {t.list.document}
              </span>

              <span>
                {t.list.phone}
              </span>

              <span>
                {t.list.privilege}
              </span>

              <span>
                {t.list.status}
              </span>

              <span>
                {t.list.actions}
              </span>
            </div>

            {filtered.map(
              (professional) => (
                <article
                  key={
                    professional.id
                  }
                  className={
                    styles.row
                  }
                >
                  <div
                    className={
                      styles.identity
                    }
                  >
                    {professional.avatarUrl ? (
                      <img
                        src={
                          professional.avatarUrl
                        }
                        alt={
                          professional.fullName
                        }
                      />
                    ) : (
                      <div
                        className={
                          styles.avatar
                        }
                      >
                        {professional.fullName
                          .split(/\s+/)
                          .map(
                            (item) =>
                              item[0],
                          )
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}

                    <button
                      className={
                        styles.linkButton
                      }
                      onClick={() => {
                        setSelected(
                          professional,
                        );

                        setModal(
                          'details',
                        );
                      }}
                    >
                      <strong>
                        {
                          professional.fullName
                        }
                      </strong>

                      <small>
                        {professional.jobTitle ??
                          t.notProvided}
                      </small>
                    </button>
                  </div>

                  <div
                    className={
                      styles.specialtyTags
                    }
                  >
                    {professional
                      .specialties.length
                      ? professional.specialties.map(
                          (
                            specialtyItem,
                          ) => (
                            <span
                              key={
                                specialtyItem.id
                              }
                              className={
                                styles.specialtyTag
                              }
                            >
                              <i
                                style={{
                                  background:
                                    specialtyItem.color,
                                }}
                              />

                              {
                                specialtyItem.name
                              }
                            </span>
                          ),
                        )
                      : t.notProvided}
                  </div>

                  <span>
                    {professional.documentNumber ??
                      t.notProvided}
                  </span>

                  <span>
                    {professional.phone ??
                      t.notProvided}
                  </span>

                  <span>
                    {professional.role ??
                      t.access.noAccess}
                  </span>

                  <span
                    className={
                      professional.active
                        ? styles.active
                        : styles.inactive
                    }
                  >
                    {professional.active
                      ? t.status.active
                      : t.status.inactive}
                  </span>

                  <div
                    className={
                      styles.actions
                    }
                  >
                    {initialData.canEdit && (
                      <button
                        onClick={() =>
                          openEdit(
                            professional,
                          )
                        }
                      >
                        {t.actions.edit}
                      </button>
                    )}

                    {initialData.canManageAccess && (
                      <button
                        onClick={() => {
                          setSelected(
                            professional,
                          );

                          setRole(
                            professional.role ===
                              'ADMIN'
                              ? 'ADMIN'
                              : 'PROFESSIONAL',
                          );

                          setInviteEmail(
                            professional.email ??
                              '',
                          );

                          setPermissionOverrides(
                            Object.fromEntries(
                              permissionCodes.map(
                                (
                                  code,
                                ) => [
                                  code,
                                  professional.permissions.includes(
                                    code as any,
                                  ),
                                ],
                              ),
                            ),
                          );

                          setModal(
                            'access',
                          );
                        }}
                      >
                        {t.actions.access}
                      </button>
                    )}

                    {initialData.canDisable &&
                      (professional.active ? (
                        <button
                          onClick={() => {
                            setSelected(
                              professional,
                            );

                            setReplacementId(
                              '',
                            );

                            setModal(
                              'deactivate',
                            );
                          }}
                        >
                          {
                            t.actions
                              .disable
                          }
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            startTransition(
                              async () => {
                                await setProfessionalStatusAction(
                                  professional.id,
                                  true,
                                );

                                router.refresh();
                              },
                            )
                          }
                        >
                          {
                            t.actions
                              .enable
                          }
                        </button>
                      ))}
                  </div>
                </article>
              ),
            )}

            {!filtered.length && (
              <p
                className={
                  styles.empty
                }
              >
                {t.filters.noResults}
              </p>
            )}
          </section>
        </>
      )}

      {tab === 'specialties' && (
        <>
          <section
            className={
              styles.specialtyIntro
            }
          >
            <div>
              <span>
                {t.specialties.eyebrow}
              </span>

              <h2>
                {t.specialties.title}
              </h2>

              <p>
                {
                  t.specialties
                    .description
                }
              </p>
            </div>
          </section>

          <section
            className={
              styles.specialtyFilters
            }
          >
            <label>
              <span>
                {
                  t.specialties
                    .filters.search
                }
              </span>

              <input
                value={specialtySearch}
                onChange={(event) =>
                  setSpecialtySearch(
                    event.target.value,
                  )
                }
                placeholder={
                  t.specialties.filters
                    .searchPlaceholder
                }
              />
            </label>

            <label>
              <span>
                {
                  t.specialties
                    .fields.area
                }
              </span>

              <select
                value={specialtyArea}
                onChange={(event) =>
                  setSpecialtyArea(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  {t.filters.all}
                </option>

                {specialtyAreas.map(
                  (area) => (
                    <option
                      key={area}
                      value={area}
                    >
                      {
                        t.specialtyAreas[
                          area
                        ]
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                {t.filters.status}
              </span>

              <select
                value={
                  specialtyStatus
                }
                onChange={(event) =>
                  setSpecialtyStatus(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  {t.filters.all}
                </option>

                <option value="ACTIVE">
                  {t.status.active}
                </option>

                <option value="INACTIVE">
                  {t.status.inactive}
                </option>
              </select>
            </label>

            <button
              className={styles.clear}
              onClick={() => {
                setSpecialtySearch('');
                setSpecialtyArea('');
                setSpecialtyStatus('');
              }}
            >
              {t.filters.clear}
            </button>
          </section>

          <section
            className={`${styles.list} ${styles.specialtyList}`}
          >
            <div
              className={`${styles.listHead} ${styles.specialtyListHead}`}
            >
              <span>
                {
                  t.specialties.list
                    .specialty
                }
              </span>

              <span>
                {
                  t.specialties.list
                    .area
                }
              </span>

              <span>
                {
                  t.specialties.list
                    .color
                }
              </span>

              <span>
                {
                  t.specialties.list
                    .professionals
                }
              </span>

              <span>
                {t.list.status}
              </span>

              <span>
                {t.list.actions}
              </span>
            </div>

            {filteredSpecialties.map(
              (specialtyItem) => (
                <article
                  key={
                    specialtyItem.id
                  }
                  className={`${styles.row} ${styles.specialtyRow}`}
                >
                  <strong>
                    {
                      specialtyItem.name
                    }
                  </strong>

                  <span>
                    {
                      t.specialtyAreas[
                        specialtyItem.area
                      ]
                    }
                  </span>

                  <span
                    className={
                      styles.colorCell
                    }
                  >
                    <i
                      style={{
                        background:
                          specialtyItem.color,
                      }}
                    />

                    {
                      specialtyItem.color
                    }
                  </span>

                  <span>
                    {
                      specialtyItem.professionalCount
                    }
                  </span>

                  <span
                    className={
                      specialtyItem.active
                        ? styles.active
                        : styles.inactive
                    }
                  >
                    {specialtyItem.active
                      ? t.status.active
                      : t.status.inactive}
                  </span>

                  <div
                    className={
                      styles.actions
                    }
                  >
                    {initialData.canEdit && (
                      <button
                        onClick={() =>
                          openSpecialty(
                            specialtyItem,
                          )
                        }
                      >
                        {t.actions.edit}
                      </button>
                    )}

                    {initialData.canEdit && (
                      <button
                        onClick={() =>
                          startTransition(
                            async () => {
                              const result =
                                await setSpecialtyStatusAction(
                                  specialtyItem.id,
                                  !specialtyItem.active,
                                );

                              setFeedback({
                                type: result.success
                                  ? 'success'
                                  : 'error',

                                message:
                                  result.success
                                    ? t
                                        .specialties
                                        .feedback
                                        .statusSaved
                                    : t
                                        .specialties
                                        .feedback
                                        .statusFailed,
                              });

                              if (
                                result.success
                              ) {
                                router.refresh();
                              }
                            },
                          )
                        }
                      >
                        {specialtyItem.active
                          ? t.actions.disable
                          : t.actions.enable}
                      </button>
                    )}
                  </div>
                </article>
              ),
            )}

            {!filteredSpecialties.length && (
              <p
                className={
                  styles.empty
                }
              >
                {
                  t.specialties.filters
                    .noResults
                }
              </p>
            )}
          </section>
        </>
      )}

      {modal === 'form' && (
        <Dialog
          title={
            selected
              ? t.form.editTitle
              : t.form.newTitle
          }
          onClose={() =>
            setModal(null)
          }
        >
          <form
            className={styles.form}
            onSubmit={submit}
          >
            <div
              className={styles.grid}
            >
              <Field
                label={
                  t.fields.firstName
                }
              >
                <input
                  required
                  value={form.firstName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      firstName:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.fields.lastName
                }
              >
                <input
                  required
                  value={form.lastName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      lastName:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.fields
                    .preferredName
                }
              >
                <input
                  value={
                    form.preferredName
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      preferredName:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.fields.jobTitle
                }
              >
                <input
                  value={form.jobTitle}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      jobTitle:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.fields.email
                }
              >
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      email:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.fields.phone
                }
              >
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.fields.country
                }
              >
                <input
                  maxLength={2}
                  value={
                    form.countryCode
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      countryCode:
                        event.target.value.toUpperCase(),
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.fields.birthDate
                }
              >
                <input
                  type="date"
                  value={
                    form.birthDate
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      birthDate:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.fields
                    .documentType
                }
              >
                <select
                  value={
                    form.documentType
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      documentType:
                        event.target
                          .value,
                    })
                  }
                >
                  <option value="">
                    {t.notProvided}
                  </option>

                  <option>
                    CPF
                  </option>

                  <option>
                    PASSPORT
                  </option>

                  <option>
                    OTHER
                  </option>
                </select>
              </Field>

              <Field
                label={
                  t.fields
                    .documentNumber
                }
              >
                <input
                  value={
                    form.documentNumber
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      documentNumber:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>
            </div>

            <fieldset>
              <legend>
                {t.fields.specialties}
              </legend>

              <div
                className={
                  styles.checks
                }
              >
                {initialData.specialties
                  .filter(
                    (item) =>
                      item.active,
                  )
                  .map((item) => (
                    <label
                      key={item.id}
                    >
                      <input
                        className={
                          styles.cleanCheckbox
                        }
                        type="checkbox"
                        checked={form.specialtyIds.includes(
                          item.id,
                        )}
                        onChange={(
                          event,
                        ) =>
                          setForm({
                            ...form,

                            specialtyIds:
                              event.target.checked
                                ? [
                                    ...form.specialtyIds,
                                    item.id,
                                  ]
                                : form.specialtyIds.filter(
                                    (
                                      id,
                                    ) =>
                                      id !==
                                      item.id,
                                  ),
                          })
                        }
                      />

                      <i
                        className={
                          styles.checkboxColor
                        }
                        style={{
                          background:
                            item.color,
                        }}
                      />

                      {item.name}
                    </label>
                  ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                {t.fields.services}
              </legend>

              <div
                className={
                  styles.checks
                }
              >
                {initialData.activities
                  .filter(
                    (activity) =>
                      activity.active,
                  )
                  .map(
                    (activity) => (
                      <label
                        key={
                          activity.id
                        }
                      >
                        <input
                          className={
                            styles.cleanCheckbox
                          }
                          type="checkbox"
                          checked={form.activityIds.includes(
                            activity.id,
                          )}
                          onChange={(
                            event,
                          ) =>
                            setForm({
                              ...form,

                              activityIds:
                                event.target.checked
                                  ? [
                                      ...form.activityIds,
                                      activity.id,
                                    ]
                                  : form.activityIds.filter(
                                      (
                                        id,
                                      ) =>
                                        id !==
                                        activity.id,
                                    ),
                            })
                          }
                        />

                        {activity.name}
                      </label>
                    ),
                  )}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                {
                  t.fields
                    .availability
                }
              </legend>

              <p
                className={
                  styles.fieldHelp
                }
              >
                {t.availability.help}
              </p>

              <div
                className={
                  styles.availabilityDays
                }
              >
                {Array.from(
                  { length: 7 },
                  (_, weekday) => (
                    <div
                      className={
                        styles.availabilityDay
                      }
                      key={weekday}
                    >
                      <div
                        className={
                          styles.dayHeader
                        }
                      >
                        <strong>
                          {
                            t.weekdays[
                              weekday
                            ]
                          }
                        </strong>

                        <button
                          type="button"
                          className={
                            styles.smallButton
                          }
                          onClick={() =>
                            addInterval(
                              weekday,
                            )
                          }
                        >
                          +{' '}
                          {
                            t
                              .availability
                              .addInterval
                          }
                        </button>
                      </div>

                      {form.availabilityRules
                        .filter(
                          (rule) =>
                            rule.weekday ===
                            weekday,
                        )
                        .map(
                          (rule) => (
                            <div
                              className={
                                styles.availabilityRow
                              }
                              key={
                                rule.key
                              }
                            >
                              <label
                                className={
                                  styles.enabledToggle
                                }
                              >
                                <input
                                  className={
                                    styles.cleanCheckbox
                                  }
                                  type="checkbox"
                                  checked={
                                    rule.enabled
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateInterval(
                                      rule.key,
                                      {
                                        enabled:
                                          event
                                            .target
                                            .checked,
                                      },
                                    )
                                  }
                                />

                                <span>
                                  {rule.enabled
                                    ? t
                                        .availability
                                        .available
                                    : t
                                        .availability
                                        .unavailable}
                                </span>
                              </label>

                              <input
                                type="time"
                                disabled={
                                  !rule.enabled
                                }
                                value={
                                  rule.startTime
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateInterval(
                                    rule.key,
                                    {
                                      startTime:
                                        event
                                          .target
                                          .value,
                                    },
                                  )
                                }
                              />

                              <span
                                className={
                                  styles.timeSeparator
                                }
                              >
                                –
                              </span>

                              <input
                                type="time"
                                disabled={
                                  !rule.enabled
                                }
                                value={
                                  rule.endTime
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateInterval(
                                    rule.key,
                                    {
                                      endTime:
                                        event
                                          .target
                                          .value,
                                    },
                                  )
                                }
                              />

                              <button
                                type="button"
                                className={
                                  styles.iconButton
                                }
                                onClick={() =>
                                  removeInterval(
                                    rule.key,
                                    weekday,
                                  )
                                }
                                aria-label={
                                  t
                                    .availability
                                    .removeInterval
                                }
                              >
                                ×
                              </button>
                            </div>
                          ),
                        )}
                    </div>
                  ),
                )}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                {
                  t.fields
                    .registrations
                }
              </legend>

              {form.registrations.map(
                (
                  registration,
                  index,
                ) => (
                  <div
                    className={
                      styles.registration
                    }
                    key={index}
                  >
                    <input
                      placeholder={
                        t.fields
                          .registrationAuthority
                      }
                      value={
                        registration.authority
                      }
                      onChange={(
                        event,
                      ) => {
                        const updated =
                          [
                            ...form.registrations,
                          ];

                        updated[
                          index
                        ] = {
                          ...updated[
                            index
                          ],

                          authority:
                            event
                              .target
                              .value,
                        };

                        setForm({
                          ...form,
                          registrations:
                            updated,
                        });
                      }}
                    />

                    <input
                      placeholder={
                        t.fields
                          .registrationNumber
                      }
                      value={
                        registration.registrationNumber
                      }
                      onChange={(
                        event,
                      ) => {
                        const updated =
                          [
                            ...form.registrations,
                          ];

                        updated[
                          index
                        ] = {
                          ...updated[
                            index
                          ],

                          registrationNumber:
                            event
                              .target
                              .value,
                        };

                        setForm({
                          ...form,
                          registrations:
                            updated,
                        });
                      }}
                    />

                    <input
                      placeholder={
                        t.fields
                          .registrationRegion
                      }
                      value={
                        registration.region
                      }
                      onChange={(
                        event,
                      ) => {
                        const updated =
                          [
                            ...form.registrations,
                          ];

                        updated[
                          index
                        ] = {
                          ...updated[
                            index
                          ],

                          region:
                            event
                              .target
                              .value,
                        };

                        setForm({
                          ...form,
                          registrations:
                            updated,
                        });
                      }}
                    />
                  </div>
                ),
              )}

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,

                    registrations: [
                      ...form.registrations,

                      {
                        authority: '',
                        registrationNumber:
                          '',
                        region: '',
                      },
                    ],
                  })
                }
              >
                {
                  t.actions
                    .addRegistration
                }
              </button>
            </fieldset>

            <Field
              label={t.fields.notes}
            >
              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    notes:
                      event.target.value,
                  })
                }
              />
            </Field>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  setModal(null)
                }
              >
                {t.actions.cancel}
              </button>

              <button
                className={
                  styles.primary
                }
                disabled={pending}
              >
                {t.actions.save}
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {modal === 'specialty' && (
        <Dialog
          title={
            specialtyForm.id
              ? t.specialties.form
                  .editTitle
              : t.specialties.form
                  .newTitle
          }
          onClose={() =>
            setModal(null)
          }
        >
          <form
            className={styles.form}
            onSubmit={
              submitSpecialty
            }
          >
            <div
              className={styles.grid}
            >
              <Field
                label={
                  t.specialties.fields
                    .name
                }
              >
                <input
                  required
                  value={
                    specialtyForm.name
                  }
                  onChange={(event) =>
                    setSpecialtyForm({
                      ...specialtyForm,
                      name:
                        event.target
                          .value,
                    })
                  }
                />
              </Field>

              <Field
                label={
                  t.specialties.fields
                    .area
                }
              >
                <select
                  value={
                    specialtyForm.area
                  }
                  onChange={(event) =>
                    setSpecialtyForm({
                      ...specialtyForm,

                      area: event
                        .target
                        .value as ProfessionalSpecialtyArea,
                    })
                  }
                >
                  {specialtyAreas.map(
                    (area) => (
                      <option
                        key={area}
                        value={area}
                      >
                        {
                          t
                            .specialtyAreas[
                            area
                          ]
                        }
                      </option>
                    ),
                  )}
                </select>
              </Field>

              <Field
                label={
                  t.specialties.fields
                    .color
                }
              >
                <div
                  className={
                    styles.colorPicker
                  }
                >
                  <input
                    type="color"
                    value={
                      specialtyForm.color
                    }
                    onChange={(event) =>
                      setSpecialtyForm({
                        ...specialtyForm,

                        color:
                          event.target.value.toUpperCase(),
                      })
                    }
                  />

                  <input
                    pattern="#[0-9A-Fa-f]{6}"
                    value={
                      specialtyForm.color
                    }
                    onChange={(event) =>
                      setSpecialtyForm({
                        ...specialtyForm,

                        color:
                          event.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </Field>
            </div>

            <p
              className={
                styles.fieldHelp
              }
            >
              {
                t.specialties.fields
                  .colorHelp
              }
            </p>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                type="button"
                onClick={() =>
                  setModal(null)
                }
              >
                {t.actions.cancel}
              </button>

              <button
                className={
                  styles.primary
                }
                disabled={pending}
              >
                {t.actions.save}
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {modal === 'details' &&
        selected && (
          <Dialog
            title={
              selected.fullName
            }
            onClose={() =>
              setModal(null)
            }
          >
            <ProfessionalAvatarEditor
              professionalId={
                selected.id
              }
              avatarUrl={
                selected.avatarUrl
              }
              fullName={
                selected.fullName
              }
              labels={{
                change:
                  t.avatar.change,
                remove:
                  t.avatar.remove,
                invalid:
                  t.avatar.invalid,
              }}
            />

            <div
              className={
                styles.details
              }
            >
              <p>
                <b>
                  {t.fields.age}:
                </b>{' '}
                {age(
                  selected.birthDate,
                ) ?? t.notProvided}
              </p>

              <p>
                <b>
                  {t.fields.country}:
                </b>{' '}
                {selected.countryCode ??
                  t.notProvided}
              </p>

              <p>
                <b>
                  {
                    t.fields
                      .documentNumber
                  }
                  :
                </b>{' '}
                {selected.documentNumber ??
                  t.notProvided}
              </p>

              <p>
                <b>
                  {
                    t.fields
                      .specialties
                  }
                  :
                </b>{' '}
                {selected.specialties
                  .map(
                    (item) =>
                      item.name,
                  )
                  .join(', ') ||
                  t.notProvided}
              </p>

              <p>
                <b>
                  {
                    t.fields
                      .registrations
                  }
                  :
                </b>{' '}
                {selected.registrations
                  .map(
                    (registration) =>
                      `${registration.authority} ${registration.registrationNumber}${
                        registration.region
                          ? `-${registration.region}`
                          : ''
                      }`,
                  )
                  .join(', ') ||
                  t.notProvided}
              </p>

              <p>
                <b>
                  {t.fields.services}:
                </b>{' '}
                {initialData.activities
                  .filter((activity) =>
                    selected.activityIds.includes(
                      activity.id,
                    ),
                  )
                  .map(
                    (activity) =>
                      activity.name,
                  )
                  .join(', ') ||
                  t.notProvided}
              </p>

              <p>
                <b>
                  {t.fields.notes}:
                </b>{' '}
                {selected.notes ??
                  t.notProvided}
              </p>
            </div>
          </Dialog>
        )}

      {modal === 'deactivate' &&
        selected && (
          <Dialog
            title={
              t.deactivate.title
            }
            onClose={() =>
              setModal(null)
            }
          >
            <p>
              {t.deactivate.description.replace(
                '{name}',
                selected.fullName,
              )}
            </p>

            <label
              className={
                styles.stack
              }
            >
              <span>
                {
                  t.deactivate
                    .replacement
                }
              </span>

              <select
                value={
                  replacementId
                }
                onChange={(event) =>
                  setReplacementId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  {
                    t.deactivate
                      .noReplacement
                  }
                </option>

                {initialData.professionals
                  .filter(
                    (professional) =>
                      professional.active &&
                      professional.id !==
                        selected.id,
                  )
                  .map(
                    (professional) => (
                      <option
                        key={
                          professional.id
                        }
                        value={
                          professional.id
                        }
                      >
                        {
                          professional.fullName
                        }
                      </option>
                    ),
                  )}
              </select>
            </label>

            <div
              className={
                styles.modalActions
              }
            >
              <button
                onClick={() =>
                  setModal(null)
                }
              >
                {t.actions.cancel}
              </button>

              <button
                className={
                  styles.danger
                }
                onClick={() =>
                  startTransition(
                    async () => {
                      if (
                        replacementId
                      ) {
                        const result =
                          await reassignFutureAppointmentsAction(
                            selected.id,
                            replacementId,
                          );

                        if (
                          !result.success
                        ) {
                          setFeedback({
                            type: 'error',
                            message:
                              t
                                .feedback
                                .reassignFailed,
                          });

                          return;
                        }
                      }

                      await confirmDisable();
                    },
                  )
                }
              >
                {t.actions.disable}
              </button>
            </div>
          </Dialog>
        )}

      {modal === 'access' &&
        selected && (
          <Dialog
            title={t.access.title}
            onClose={() =>
              setModal(null)
            }
          >
            <div
              className={styles.form}
            >
              <p>
                {t.access.description}
              </p>

              {!selected.userId ? (
                <>
                  <Field
                    label={
                      t.fields.email
                    }
                  >
                    <input
                      value={
                        inviteEmail
                      }
                      onChange={(
                        event,
                      ) =>
                        setInviteEmail(
                          event.target
                            .value,
                        )
                      }
                    />
                  </Field>

                  <Field
                    label={
                      t.access.level
                    }
                  >
                    <select
                      value={role}
                      onChange={(
                        event,
                      ) =>
                        setRole(
                          event.target
                            .value as
                            | 'ADMIN'
                            | 'PROFESSIONAL',
                        )
                      }
                    >
                      <option value="PROFESSIONAL">
                        PROFESSIONAL
                      </option>

                      <option value="ADMIN">
                        ADMIN
                      </option>
                    </select>
                  </Field>

                  <button
                    className={
                      styles.primary
                    }
                    disabled={
                      pending ||
                      !inviteEmail
                    }
                    onClick={() =>
                      startTransition(
                        async () => {
                          const result =
                            await inviteProfessionalAction(
                              selected.id,
                              inviteEmail,
                              role,
                            );

                          setFeedback({
                            type: result.success
                              ? 'success'
                              : 'error',

                            message:
                              result.success
                                ? t
                                    .feedback
                                    .invited
                                : t
                                    .feedback
                                    .inviteFailed,
                          });

                          if (
                            result.success
                          ) {
                            setModal(
                              null,
                            );

                            router.refresh();
                          }
                        },
                      )
                    }
                  >
                    {t.access.invite}
                  </button>
                </>
              ) : (
                <>
                  <Field
                    label={
                      t.access.level
                    }
                  >
                    <select
                      value={role}
                      onChange={(
                        event,
                      ) =>
                        setRole(
                          event.target
                            .value as
                            | 'ADMIN'
                            | 'PROFESSIONAL',
                        )
                      }
                    >
                      <option value="PROFESSIONAL">
                        PROFESSIONAL
                      </option>

                      <option value="ADMIN">
                        ADMIN
                      </option>
                    </select>
                  </Field>

                  <div
                    className={
                      styles.permissionGrid
                    }
                  >
                    {permissionCodes.map(
                      (code) => (
                        <label
                          key={code}
                        >
                          <input
                            className={
                              styles.cleanCheckbox
                            }
                            type="checkbox"
                            checked={
                              permissionOverrides[
                                code
                              ] ??
                              false
                            }
                            onChange={(
                              event,
                            ) =>
                              setPermissionOverrides(
                                {
                                  ...permissionOverrides,

                                  [code]:
                                    event
                                      .target
                                      .checked,
                                },
                              )
                            }
                          />

                          <span>
                            {code}
                          </span>
                        </label>
                      ),
                    )}
                  </div>

                  <button
                    className={
                      styles.primary
                    }
                    onClick={() =>
                      startTransition(
                        async () => {
                          const result =
                            await saveProfessionalAccessAction(
                              {
                                professionalId:
                                  selected.id,

                                role,

                                permissionOverrides,
                              },
                            );

                          setFeedback({
                            type: result.success
                              ? 'success'
                              : 'error',

                            message:
                              result.success
                                ? t
                                    .feedback
                                    .accessSaved
                                : t
                                    .feedback
                                    .accessFailed,
                          });

                          if (
                            result.success
                          ) {
                            setModal(
                              null,
                            );

                            router.refresh();
                          }
                        },
                      )
                    }
                  >
                    {t.actions.save}
                  </button>
                </>
              )}
            </div>
          </Dialog>
        )}
    </main>
  );
}

const permissionCodes = [
  'CUSTOMERS_VIEW',
  'CUSTOMERS_CREATE',
  'CUSTOMERS_EDIT',
  'SERVICES_VIEW',
  'SERVICES_CREATE',
  'SERVICES_EDIT',
  'PROFESSIONALS_VIEW',
  'PROFESSIONALS_CREATE',
  'PROFESSIONALS_EDIT',
  'PROFESSIONALS_DISABLE',
  'SCHEDULING_VIEW_ALL',
  'SCHEDULING_VIEW_OWN',
  'SCHEDULING_CREATE',
  'SCHEDULING_EDIT',
  'SCHEDULING_CANCEL',
  'SCHEDULING_RESCHEDULE',
  'ATTENDANCE_VIEW',
  'ATTENDANCE_MANAGE',
  'MAKEUPS_VIEW',
  'MAKEUPS_MANAGE',
  'FINANCIAL_VIEW',
  'FINANCIAL_MANAGE',
] as const;

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.overlay}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
      >
        <header>
          <h2>{title}</h2>

          <button onClick={onClose}>
            ×
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.stack}>
      <span>{label}</span>

      {children}
    </label>
  );
}