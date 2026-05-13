recruiter_id = Column(Integer, nullable=True)

candidate_status = Column(
    String(50),
    default="screening"
)

recruiter_notes = Column(
    Text,
    nullable=True
)