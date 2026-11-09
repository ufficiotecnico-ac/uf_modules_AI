import { toSubmitPayload } from './outing-payload'
import { validOutingValues } from './test-values'

describe('dati da inviare alla funzione di salvataggio', () => {
  it('converte un\'uscita di un giorno', () => {
    const payload = toSubmitPayload(validOutingValues())

    expect(payload).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      outing_type_id: 'local-outing',
      project: null,
      destination: 'Museo di storia naturale',
      start_date: '2026-11-11',
      end_date: '2026-11-11',
      departure_time: '08:00',
      return_time: '14:00',
      needs: null,
      objective: 'Visita guidata al museo',
      program: 'Mattina: visita guidata',
      other_services: null,
      notes: null,
      lead_person_id: 'person-utente',
      classes: [
        {
          class_id: 'class-1a',
          students_count: 20,
          males_count: null,
          females_count: null,
          students_with_disabilities: 1,
        },
      ],
      companion_ids: ['person-verdi'],
      transports: [
        {
          transport_type_id: 'train',
          departure_place: 'Stazione centrale',
          departure_day: '2026-11-11',
          departure_time: '08:30',
          destination: 'Milano',
          return_required: true,
          return_day: null,
          return_time: '13:00',
          notes: null,
        },
      ],
      bookings: [{ booking_type_id: 'guides', description: 'Guida al museo', time: '10:00' }],
    })
  })

  it('per più giorni usa la data di ritorno e ricava gli alunni da maschi e femmine', () => {
    const payload = toSubmitPayload(
      validOutingValues({
        multi_day: true,
        end_date: '2026-11-13',
        classes: [
          {
            class_id: 'class-1a',
            students_count: '99',
            males_count: '12',
            females_count: '10',
            students_with_disabilities: '0',
          },
        ],
        transports: [
          {
            transport_type_id: 'train',
            departure_place: 'Stazione',
            departure_day: '2026-11-12',
            departure_time: '08:00',
            destination: 'Roma',
            return_required: true,
            return_day: '2026-11-13',
            return_time: '17:00',
            notes: 'Posti vicini',
          },
        ],
      }),
    )

    expect(payload.end_date).toBe('2026-11-13')
    expect(payload.classes).toEqual([
      {
        class_id: 'class-1a',
        students_count: 22,
        males_count: 12,
        females_count: 10,
        students_with_disabilities: 0,
      },
    ])
    expect(payload.transports).toEqual([
      {
        transport_type_id: 'train',
        departure_place: 'Stazione',
        departure_day: '2026-11-12',
        departure_time: '08:00',
        destination: 'Roma',
        return_required: true,
        return_day: '2026-11-13',
        return_time: '17:00',
        notes: 'Posti vicini',
      },
    ])
  })

  it('per un giorno solo ignora maschi, femmine e giorni rimasti nei campi', () => {
    const payload = toSubmitPayload(
      validOutingValues({
        end_date: '2026-11-20',
        classes: [
          {
            class_id: 'class-1a',
            students_count: '20',
            males_count: '5',
            females_count: '5',
            students_with_disabilities: '0',
          },
        ],
        transports: [
          {
            transport_type_id: 'train',
            departure_place: 'Stazione',
            departure_day: '2026-11-15',
            departure_time: '08:00',
            destination: 'Roma',
            return_required: true,
            return_day: '2026-11-16',
            return_time: '17:00',
            notes: '',
          },
        ],
      }),
    )

    expect(payload.end_date).toBe('2026-11-11')
    expect(payload.classes).toMatchObject([{ students_count: 20, males_count: null, females_count: null }])
    expect(payload.transports).toMatchObject([{ departure_day: '2026-11-11', return_day: null }])
  })

  it('senza ritorno da prenotare toglie orario e giorno di ritorno', () => {
    const [transport] = toSubmitPayload(
      validOutingValues({
        multi_day: true,
        end_date: '2026-11-13',
        classes: [
          {
            class_id: 'class-1a',
            students_count: '',
            males_count: '1',
            females_count: '1',
            students_with_disabilities: '0',
          },
        ],
        transports: [
          {
            transport_type_id: 'train',
            departure_place: 'Stazione',
            departure_day: '2026-11-12',
            departure_time: '08:00',
            destination: 'Roma',
            return_required: false,
            return_day: '2026-11-13',
            return_time: '17:00',
            notes: '',
          },
        ],
      }),
    ).transports as Record<string, unknown>[]

    expect(transport).toMatchObject({ return_required: false, return_day: null, return_time: null })
  })

  it('toglie gli spazi ai bordi e trasforma i testi vuoti in null', () => {
    const payload = toSubmitPayload(
      validOutingValues({
        destination: '  Museo  ',
        project: '   ',
        needs: ' pedana ',
        other_services: '',
        notes: '  ',
      }),
    )

    expect(payload).toMatchObject({
      destination: 'Museo',
      project: null,
      needs: 'pedana',
      other_services: null,
      notes: null,
    })
  })

  it("mette l'accompagnatore per primo e poi gli altri", () => {
    const payload = toSubmitPayload(
      validOutingValues({ companion_id: 'p-main', other_companion_ids: ['p-2', 'p-3'] }),
    )

    expect(payload.companion_ids).toEqual(['p-main', 'p-2', 'p-3'])
  })
})
